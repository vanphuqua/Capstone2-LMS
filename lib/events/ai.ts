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
