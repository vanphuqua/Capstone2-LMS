/**
 * AI Gateway — Gemini (primary) + Cline (fallback)
 *
 * Single abstraction layer for all AI features (quiz generation, course
 * content, Q&A assistant, ...). Both providers are called through their
 * OpenAI-compatible Chat Completions endpoints, so the request shape is
 * identical and switching providers is only a config change.
 *
 * Flow: try Gemini → on any failure (429 / 5xx / timeout / auth) fall back
 * to Cline once. If both fail, an AIError with per-provider details is thrown.
 *
 * Env (see .env.example): GEMINI_API_KEY, CLINE_API_KEY,
 * optional AI_GEMINI_MODEL / AI_CLINE_MODEL / AI_TIMEOUT_MS.
 *
 * Note: rate-limit AI routes with lib/rate-limiter.ts and enforce per-user
 * quotas (e.g. AIUsageLog) before production traffic.
 */

import { z } from "zod";

export type AIProvider = "gemini" | "cline";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }
  
  export interface AIResult {
    content: string;
    provider: AIProvider;
    model: string;
    /** True when the primary provider failed and Cline answered instead */
    fallbackUsed: boolean;
    latencyMs: number;
    usage?: AIUsage;
  }

  export interface ChatCompletionOptions {
    /** Override the default model for this call */
    model?: string;
    temperature?: number;
    maxTokens?: number;
    /** Per-attempt timeout in ms (default AI_TIMEOUT_MS or 30000) */
    timeoutMs?: number;
  }
  
  export class AIError extends Error {
    readonly attempts: Array<{ provider: AIProvider; error: string }>;
  
    constructor(
      message: string,
      attempts: Array<{ provider: AIProvider; error: string }>,
    ) {
      super(message);
      this.name = "AIError";
      this.attempts = attempts;
    }
  }
  
  interface ProviderConfig {
    name: AIProvider;
    baseUrl: string;
    apiKey: string;
    defaultModel: string;
  }
  
  const DEFAULT_TIMEOUT_MS = 30_000;
  
  const getTimeoutMs = (): number => {
    const raw = parseInt(process.env.AI_TIMEOUT_MS || "", 10);
    return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
  };
  
  /**
 * Resolve provider configs from env. Providers without an API key are
 * skipped (a missing primary simply promotes the fallback).
 */
const getProviders = (): ProviderConfig[] => {
    const providers: ProviderConfig[] = [];
  
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      providers.push({
        name: "gemini",
        // Google exposes an OpenAI-compatible endpoint on the Generative Language API
        // No trailing slash — fetch() appends "/chat/completions"
        // (a double slash here causes 404 from Google)
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
        apiKey: geminiKey,
        // NOTE: gemini-2.0-flash was retired by Google (404 as of Oct 2026).
        // gemini-2.5-flash verified working live; override via AI_GEMINI_MODEL
        // (e.g. "gemini-3.8-flash" — Google's current recommendation).
        defaultModel: process.env.AI_GEMINI_MODEL || "gemini-2.5-flash",
      });
    }
  
    const clineKey = process.env.CLINE_API_KEY;
    if (clineKey) {
      providers.push({
        name: "cline",
        baseUrl: "https://api.cline.bot/api/v1",
        apiKey: clineKey,
        // z-ai/glm-5.3-flash: fastest + cheapest model tested on the Cline API
        // (~$0.00005/call). Free alternatives: minimax/minimax-m3.1-flash:free
        defaultModel: process.env.AI_CLINE_MODEL || "minimax/minimax-m2.5",
      });
    }
  
    return providers;
  };

  /** Cheap check for feature routes: is at least one provider configured? */
export const isAIConfigured = (): boolean => getProviders().length > 0;

/** Provider status for the admin health endpoint */
export const getAIStatus = () => {
  const providers = getProviders();
  return {
    gemini: {
      configured: providers.some((p) => p.name === "gemini"),
      model: process.env.AI_GEMINI_MODEL || "gemini-2.5-flash",
    },
    cline: {
      configured: providers.some((p) => p.name === "cline"),
      model: process.env.AI_CLINE_MODEL || "z-ai/glm-5.3-flash",
    },
  };
};

interface ChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string | null };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

/** HTTP error carrying the status so transient failures can be retried */
class ProviderHttpError extends Error {
    readonly status: number;
    readonly retryAfterMs?: number;
  
    constructor(message: string, status: number, retryAfterMs?: number) {
      super(message);
      this.name = "ProviderHttpError";
      this.status = status;
      this.retryAfterMs = retryAfterMs;
    }
  }
  
  // 429 = rate limit, 5xx = provider overloaded — all worth one quick retry
  const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  
  const getProviderRetries = (): number => {
    const raw = parseInt(process.env.AI_PROVIDER_RETRIES || "", 10);
    return Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 3) : 1;
  };
  
  const callProvider = async (
    provider: ProviderConfig,
    messages: ChatMessage[],
    options: ChatCompletionOptions,
  ): Promise<AIResult> => {
    const model = options.model || provider.defaultModel;
    const timeoutMs = options.timeoutMs || getTimeoutMs();
    const startedAt = Date.now();
    const maxRetries = getProviderRetries();
  
    const runOnce = async (): Promise<AIResult> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
  
      try {
        const body: Record<string, unknown> = { model, messages };
        if (options.temperature !== undefined) body.temperature = options.temperature;
        if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens;
  
        const res = await fetch(`${provider.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
  
        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          // Retry-After is in seconds; cap it so a request never stalls too long
          const retryAfter = res.headers.get("retry-after");
          const parsedRetryAfter = retryAfter
            ? Math.min(parseInt(retryAfter, 10) * 1000, 3_000)
            : NaN;
          throw new ProviderHttpError(
            `HTTP ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`,
            res.status,
            Number.isFinite(parsedRetryAfter) ? parsedRetryAfter : undefined,
          );
        }

        const raw = (await res.json()) as ChatCompletionResponse & {
          data?: ChatCompletionResponse;
        };
        // Cline wraps the OpenAI payload in { data: {...} }; Gemini returns it flat
        const data = raw.data && raw.data.choices ? raw.data : raw;
        const choice = data.choices?.[0];
        const content = choice?.message?.content;
  
        // Surface finish_reason + a body snippet so empty replies are debuggable
        if (!content || !content.trim()) {
          const snippet = JSON.stringify(raw).slice(0, 300);
          throw new Error(
            `Empty content in response (finish_reason=${choice?.finish_reason ?? "n/a"}, body=${snippet})`,
          );
        }
  
        const usage: AIUsage | undefined = data.usage
          ? {
              promptTokens: data.usage.prompt_tokens ?? 0,
              completionTokens: data.usage.completion_tokens ?? 0,
              totalTokens: data.usage.total_tokens ?? 0,
            }
          : undefined;
  
        return {
          content,
          provider: provider.name,
          model,
          fallbackUsed: provider.name !== "gemini",
          latencyMs: Date.now() - startedAt,
          usage,
        };
      } finally {
        clearTimeout(timer);
      }
    };

    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await runOnce();
      } catch (error) {
        lastError = error;
        const retryable =
          error instanceof ProviderHttpError &&
          RETRYABLE_STATUS.has(error.status);
        if (!retryable || attempt >= maxRetries) break;
  
        const delay = error.retryAfterMs ?? 1_200;
        console.warn(
          `[AI] ${provider.name} ${error.status} (provider overloaded — transient) — retry ${attempt + 1}/${maxRetries} in ${delay}ms`,
        );
        await sleep(delay);
      }
    }
  
    throw lastError;
  };
  
  /**
   * Chat completion with automatic Gemini → Cline fallback.
   * Throws AIError when no provider could answer.
   */
  export const chatCompletion = async (
    messages: ChatMessage[],
    options: ChatCompletionOptions = {},
  ): Promise<AIResult> => {
    const providers = getProviders();
    if (providers.length === 0) {
      throw new AIError(
        "No AI provider configured. Set GEMINI_API_KEY and/or CLINE_API_KEY.",
        [],
      );
    }

    const attempts: Array<{ provider: AIProvider; error: string }> = [];

    for (const provider of providers) {
      try {
        const result = await callProvider(provider, messages, options);
        if (attempts.length > 0) {
          console.warn(
            `[AI] Fallback used: ${result.provider}/${result.model} answered after ${attempts.map((a) => a.provider).join(", ")} failed`,
          );
        }
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        attempts.push({ provider: provider.name, error: message });
        console.warn(`[AI] ${provider.name} failed: ${message}`);
      }
    }
  
    throw new AIError(
      `All AI providers failed (${attempts.map((a) => a.provider).join(", ")}).`,
      attempts,
    );
  };
  
  /** Strip markdown fences models sometimes wrap around JSON */
  const extractJSON = (text: string): string => {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) return fenced[1].trim();
    const start = text.indexOf("{");
    const startArr = text.indexOf("[");
    const first =
      start === -1 ? startArr : startArr === -1 ? start : Math.min(start, startArr);
    if (first === -1) return text.trim();
    const last = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
    return last > first ? text.slice(first, last + 1) : text.trim();
  };

  export interface GenerateJSONResult<T> {
    data: T;
    result: AIResult;
  }
  
  /**
   * Generate a value matching a Zod schema. Sends a JSON-only instruction,
   * validates the reply, and makes ONE repair attempt on invalid JSON.
   */
  export const generateJSON = async <T>(
    schema: z.ZodType<T>,
    messages: ChatMessage[],
    options: ChatCompletionOptions = {},
  ): Promise<GenerateJSONResult<T>> => {
    const instruction: ChatMessage = {
      role: "system",
      content:
        "You must respond with a single valid JSON value only. " +
        "No markdown, no code fences, no commentary before or after the JSON.",
    };
  
    let attemptMessages: ChatMessage[] = [instruction, ...messages];
    let lastResult: AIResult | undefined;
    let lastError = "";
  
    for (let i = 0; i < 2; i++) {
      const result = await chatCompletion(attemptMessages, options);
      lastResult = result;
  
      try {
        const parsed: unknown = JSON.parse(extractJSON(result.content));
        const validated = schema.safeParse(parsed);
        if (validated.success) {
          return { data: validated.data, result };
        }
        lastError = validated.error.issues
          .slice(0, 5)
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
  
      // Repair attempt: send the invalid reply back and ask for a corrected JSON
      attemptMessages = [
        ...attemptMessages,
        { role: "assistant", content: result.content },
        {
          role: "user",
          content:
            `Your previous response could not be used (${lastError}). ` +
            "Reply again with the corrected, valid JSON value only.",
        },
      ];
    }