/**
 * LLM Token Tracking Utilities
 *
 * This module provides functions for tracking token usage across LLM calls,
 * calculating costs using the pricing configuration, and managing budget limits.
 *
 * @module llm-tracker
 */

import { AIMessageChunk, BaseMessageLike } from "@langchain/core/messages";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import {
  TokenCount,
  TokenBreakdown,
  BudgetSettings,
  BudgetWarning,
  ModelTokenData,
  INITIAL_TOKEN_COUNT,
} from "@openswe/shared/open-swe/types";
import { calculateCost, formatCost } from "../config/pricing.js";
import { trackCachePerformance } from "./caching.js";
import { createLogger, LogLevel } from "./logger.js";
import { getBudgetAction, BudgetAction, BudgetCheckResult, generateBudgetMessage } from "./budget-checker.js";
import { dispatchCustomEvent } from "@langchain/core/callbacks/dispatch";

// Re-export budget checking utilities for easier access
export { getBudgetAction, BudgetAction, generateBudgetMessage };
export type { BudgetCheckResult };

const logger = createLogger(LogLevel.INFO, "LLMTracker");

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Agent roles that can accumulate token usage.
 */
export type AgentRole = "planner" | "programmer" | "reviewer" | "manager";

/**
 * Result of an LLM invocation with tracking data.
 */
export interface TrackingResult<T = AIMessageChunk> {
  /** The original LLM response */
  response: T;
  /** Token data extracted from the response */
  tokenData: ModelTokenData[];
  /** Cost breakdown for this call */
  cost: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
  };
  /** The model name used */
  modelName: string;
}

/**
 * Options for invokeWithTracking.
 */
export interface TrackingOptions {
  /** The model name/identifier for pricing lookup */
  modelName: string;
  /** Optional agent role for breakdown tracking */
  agentRole?: AgentRole;
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Wraps an LLM invocation with automatic token and cost tracking.
 *
 * This function:
 * 1. Invokes the model with the provided messages
 * 2. Extracts token usage from the response
 * 3. Calculates costs using the pricing configuration
 * 4. Returns the response along with tracking data
 *
 * @param model - The LangChain chat model to invoke
 * @param messages - Messages to send to the model
 * @param options - Tracking options including model name
 * @returns TrackingResult with response and tracking data
 *
 * @example
 * ```typescript
 * const { response, tokenData, cost } = await invokeWithTracking(
 *   modelWithTools,
 *   messages,
 *   { modelName: "claude-opus-4-5", agentRole: "programmer" }
 * );
 * ```
 */
export async function invokeWithTracking<T extends AIMessageChunk>(
  model: BaseChatModel,
  messages: BaseMessageLike[],
  options: TrackingOptions
): Promise<TrackingResult<T>> {
  const { modelName } = options;

  try {
    // Invoke the model
    const response = (await model.invoke(messages)) as T;

    // Extract token data using existing utility
    const tokenData = trackCachePerformance(response, modelName);

    // Calculate total tokens from the response
    const inputTokens = response.usage_metadata?.input_tokens ?? 0;
    const outputTokens = response.usage_metadata?.output_tokens ?? 0;

    // Calculate cost using pricing config
    const pricingModelKey = mapModelNameToPricingKey(modelName);
    const costResult = calculateCost(inputTokens, outputTokens, pricingModelKey);

    logger.info("LLM call tracked", {
      model: modelName,
      inputTokens,
      outputTokens,
      totalCost: formatCost(costResult.totalCost),
    });

    // Dispatch a custom event for real-time tracking (SSE/WebSocket flow)
    await dispatchCustomEvent("token-update", {
      model: modelName,
      agentRole: options.agentRole,
      inputTokens,
      outputTokens,
      cost: {
        inputCost: costResult.inputCost,
        outputCost: costResult.outputCost,
        totalCost: costResult.totalCost,
      },
      timestamp: new Date().toISOString(),
    });

    return {
      response,
      tokenData,
      cost: {
        inputCost: costResult.inputCost,
        outputCost: costResult.outputCost,
        totalCost: costResult.totalCost,
      },
      modelName,
    };
  } catch (error) {
    logger.error("LLM call failed", {
      model: modelName,
      error: error instanceof Error ? error.message : String(error),
    });
    // Rethrow to allow graph-level retry logic to handle it
    throw error;
  }
}

/**
 * Maps LangChain/provider model names to pricing configuration keys.
 *
 * LangChain uses model names like "claude-opus-4-5" while pricing
 * config uses full identifiers like "claude-opus-4-1-20250430".
 *
 * @param modelName - The model name from LangChain
 * @returns The pricing configuration key
 */
export function mapModelNameToPricingKey(modelName: string): string {
  // Common mappings from LangChain model names to pricing keys
  const mappings: Record<string, string> = {
    // Claude 4 series
    "claude-sonnet-4-5": "claude-sonnet-4-5-20250514",
    "claude-opus-4-5": "claude-opus-4-1-20250430",
    "claude-opus-4-1": "claude-opus-4-1-20250430",
    "claude-haiku-4": "claude-haiku-4-20250401",
    "claude-haiku-4-5": "claude-haiku-4-20250401",
    "claude-haiku-4-5-latest": "claude-haiku-4-20250401",

    // Claude 3.5 series
    "claude-3-5-sonnet-latest": "claude-3-5-sonnet-20241022",
    "claude-3-5-sonnet-20241022": "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-latest": "claude-3-5-haiku-20241022",
    "claude-3-5-haiku-20241022": "claude-3-5-haiku-20241022",

    // Claude 3 series
    "claude-3-opus-20240229": "claude-3-opus-20240229",
    "claude-3-sonnet-20240229": "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307": "claude-3-haiku-20240307",
  };

  // Return mapped key or original if no mapping exists
  return mappings[modelName] ?? modelName;
}

/**
 * Updates a TokenBreakdown with new usage data for a specific agent.
 *
 * @param breakdown - The current token breakdown
 * @param agentRole - The agent role to update
 * @param tokenData - Token data from the LLM call
 * @param cost - Cost data from the LLM call
 * @returns Updated TokenBreakdown
 *
 * @example
 * ```typescript
 * const newBreakdown = updateTokenBreakdown(
 *   state.tokenUsage,
 *   "programmer",
 *   tokenData,
 *   cost
 * );
 * return { tokenUsage: newBreakdown };
 * ```
 */
export function updateTokenBreakdown(
  breakdown: TokenBreakdown,
  agentRole: AgentRole,
  tokenData: ModelTokenData[],
  cost: { inputCost: number; outputCost: number; totalCost: number }
): TokenBreakdown {
  const agentUsage = breakdown[agentRole];
  const now = new Date().toISOString();

  // Aggregate token counts from all model data
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (const data of tokenData) {
    totalInputTokens +=
      data.inputTokens + data.cacheCreationInputTokens + data.cacheReadInputTokens;
    totalOutputTokens += data.outputTokens;
  }

  // Create updated token count
  const updatedTotal: TokenCount = {
    inputTokens: agentUsage.total.inputTokens + totalInputTokens,
    outputTokens: agentUsage.total.outputTokens + totalOutputTokens,
    totalTokens:
      agentUsage.total.totalTokens + totalInputTokens + totalOutputTokens,
    inputCost: agentUsage.total.inputCost + cost.inputCost,
    outputCost: agentUsage.total.outputCost + cost.outputCost,
    totalCost: agentUsage.total.totalCost + cost.totalCost,
    timestamp: now,
    formattedTotalTokens: formatTokenCount(
      agentUsage.total.totalTokens + totalInputTokens + totalOutputTokens
    ),
    formattedTotalCost: formatCost(
      agentUsage.total.totalCost + cost.totalCost
    ),
  };

  // Update model-specific breakdown
  const updatedByModel = { ...agentUsage.byModel };
  for (const data of tokenData) {
    const existing = updatedByModel[data.model] ?? {
      ...INITIAL_TOKEN_COUNT,
      timestamp: now,
    };

    const modelInputTokens =
      data.inputTokens + data.cacheCreationInputTokens + data.cacheReadInputTokens;

    updatedByModel[data.model] = {
      inputTokens: existing.inputTokens + modelInputTokens,
      outputTokens: existing.outputTokens + data.outputTokens,
      totalTokens: existing.totalTokens + modelInputTokens + data.outputTokens,
      inputCost: existing.inputCost + cost.inputCost,
      outputCost: existing.outputCost + cost.outputCost,
      totalCost: existing.totalCost + cost.totalCost,
      timestamp: now,
    };
  }

  // Return new breakdown with updated agent usage
  return {
    ...breakdown,
    [agentRole]: {
      total: updatedTotal,
      byModel: updatedByModel,
      startTime: agentUsage.startTime,
      lastUpdated: now,
    },
  };
}

/**
 * Checks if current token usage exceeds budget limits using advanced checker.
 *
 * @param breakdown - Current token breakdown
 * @param budgetSettings - User's budget configuration
 * @returns Result with recommended action and message
 */
export function evaluateBudget(
  breakdown: TokenBreakdown,
  budgetSettings: BudgetSettings
): BudgetCheckResult {
  const totalCost = getTotalCost(breakdown);
  return getBudgetAction(totalCost, budgetSettings);
}

/**
 * Checks if current token usage exceeds budget limits (Legacy support).
 *
 * @param breakdown - Current token breakdown
 * @param budgetSettings - User's budget configuration
 * @returns BudgetWarning if limits are exceeded, null otherwise
 */
export function checkBudgetLimits(
  breakdown: TokenBreakdown,
  budgetSettings: BudgetSettings
): BudgetWarning | null {
  // Calculate total spend across all agents
  const totalSpend =
    breakdown.planner.total.totalCost +
    breakdown.programmer.total.totalCost +
    breakdown.reviewer.total.totalCost +
    breakdown.manager.total.totalCost;

  const { maxBudget, warningThreshold } = budgetSettings;

  // Check if we're over the budget
  if (totalSpend >= maxBudget) {
    return {
      currentSpend: totalSpend,
      budgetLimit: maxBudget,
      percentageUsed: 100,
      message: `Budget exceeded! Current spend: ${formatCost(totalSpend)} / ${formatCost(maxBudget)}`,
      severity: "critical",
      timestamp: new Date().toISOString(),
    };
  }

  // Check if we're approaching the threshold
  const percentageUsed = (totalSpend / maxBudget) * 100;
  if (percentageUsed >= warningThreshold * 100) {
    return {
      currentSpend: totalSpend,
      budgetLimit: maxBudget,
      percentageUsed,
      message: `Approaching budget limit: ${formatCost(totalSpend)} / ${formatCost(maxBudget)} (${percentageUsed.toFixed(1)}%)`,
      severity: percentageUsed >= 90 ? "warning" : "info",
      timestamp: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Gets the total cost across all agents.
 *
 * @param breakdown - Current token breakdown
 * @returns Total cost in USD
 */
export function getTotalCost(breakdown: TokenBreakdown): number {
  return (
    breakdown.planner.total.totalCost +
    breakdown.programmer.total.totalCost +
    breakdown.reviewer.total.totalCost +
    breakdown.manager.total.totalCost
  );
}

/**
 * Gets the total token count across all agents.
 *
 * @param breakdown - Current token breakdown
 * @returns Total token count
 */
export function getTotalTokens(breakdown: TokenBreakdown): number {
  return (
    breakdown.planner.total.totalTokens +
    breakdown.programmer.total.totalTokens +
    breakdown.reviewer.total.totalTokens +
    breakdown.manager.total.totalTokens
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Formats a token count for display.
 *
 * @param tokens - Number of tokens
 * @returns Formatted string (e.g., "1.5k", "2.3M")
 */
function formatTokenCount(tokens: number): string {
  if (tokens < 1000) {
    return tokens.toString();
  } else if (tokens < 1_000_000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  } else {
    return `${(tokens / 1_000_000).toFixed(2)}M`;
  }
}

/**
 * Creates a summary of token usage for logging/debugging.
 *
 * @param breakdown - Current token breakdown
 * @returns Summary object
 */
export function createUsageSummary(breakdown: TokenBreakdown): {
  byAgent: Record<AgentRole, { tokens: number; cost: string }>;
  total: { tokens: number; cost: string };
} {
  const agents: AgentRole[] = ["planner", "programmer", "reviewer", "manager"];

  const byAgent = {} as Record<AgentRole, { tokens: number; cost: string }>;
  let totalTokens = 0;
  let totalCost = 0;

  for (const agent of agents) {
    const usage = breakdown[agent];
    byAgent[agent] = {
      tokens: usage.total.totalTokens,
      cost: formatCost(usage.total.totalCost),
    };
    totalTokens += usage.total.totalTokens;
    totalCost += usage.total.totalCost;
  }

  return {
    byAgent,
    total: {
      tokens: totalTokens,
      cost: formatCost(totalCost),
    },
  };
}
