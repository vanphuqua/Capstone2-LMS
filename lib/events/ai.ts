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