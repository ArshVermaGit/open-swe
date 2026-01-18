/**
 * Token Utility Helpers for LangGraph State Management
 *
 * This module provides beginner-friendly, pure functions for updating
 * token usage, checking budgets, and formatting data for the UI.
 *
 * @module token-utils
 */

import {
  GraphState,
  GraphUpdate,
  TokenUsage,
  TokenCount,
  BudgetWarning,
  ModelTokenData,
} from "@openswe/shared/open-swe/types";
import {
  AgentRole,
  updateTokenBreakdown,
  checkBudgetLimits,
} from "./llm-tracker.js";
import { formatCost } from "../config/pricing.js";

/**
 * 1. updateTokenUsage(state, update)
 *
 * Adds new token counts to the existing cumulative state.
 * Since LangGraph state is immutable, this returns a partial update object
 * that LangGraph will merge into the main state.
 *
 * @param state - The current LangGraph state
 * @param update - New usage data to add
 * @returns A GraphUpdate object containing the updated tokenUsage
 *
 * @example
 * ```typescript
 * const stateUpdate = updateTokenUsage(state, {
 *   agentRole: "planner",
 *   tokenData: result.tokenData,
 *   cost: result.cost
 * });
 * // In a graph node: return stateUpdate;
 * ```
 */
export function updateTokenUsage(
  state: GraphState,
  update: {
    agentRole: AgentRole;
    tokenData: ModelTokenData[];
    cost: { inputCost: number; outputCost: number; totalCost: number };
  }
): GraphUpdate {
  const { agentRole, tokenData, cost } = update;

  // Use our tracker utility to calculate the new breakdown
  const newTokenUsage = updateTokenBreakdown(
    state.tokenUsage,
    agentRole,
    tokenData,
    cost
  );

  return {
    tokenUsage: newTokenUsage,
  };
}

/**
 * 2. checkBudgetLimit(state)
 *
 * Checks if the cumulative budget limit has been reached or exceeded.
 * Returns a warning object if the limit is breached, otherwise returns null.
 *
 * @param state - The current LangGraph state
 * @returns BudgetWarning if threshold reached, otherwise null
 */
export function checkBudgetLimit(state: GraphState): BudgetWarning | null {
  return checkBudgetLimits(state.tokenUsage, state.budgetSettings);
}

/**
 * 3. addBudgetWarning(state, warning)
 *
 * Safely adds a new budget warning to the warnings list in the state.
 * Handles cases where budgetWarnings might not be initialized yet.
 *
 * @param state - The current LangGraph state
 * @param warning - The warning to add
 * @returns A GraphUpdate object with the new warnings list
 */
export function addBudgetWarning(
  state: GraphState,
  warning: BudgetWarning
): GraphUpdate {
  // LangGraph reducers usually handle merging arrays, but we'll be explicit here
  const currentWarnings = state.budgetWarnings || [];

  // Check if this specific warning message was already added within the last minute
  // to prevent spamming the same warning repeatedly
  const isDuplicate = currentWarnings.some(
    (w) =>
      w.message === warning.message &&
      new Date(warning.timestamp).getTime() -
        new Date(w.timestamp).getTime() <
        60000
  );

  if (isDuplicate) {
    return {};
  }

  return {
    budgetWarnings: [warning], // The state reducer will append this to the existing list
  };
}

/**
 * 4. getTokenUsageByAgent(state, agentRole)
 *
 * Retrieves the cumulative token usage for a specific agent role.
 *
 * @param state - The current LangGraph state
 * @param agentRole - The role to fetch (planner, programmer, reviewer, manager)
 * @returns TokenUsage for that specific agent
 */
export function getTokenUsageByAgent(
  state: GraphState,
  agentRole: AgentRole
): TokenUsage {
  return state.tokenUsage[agentRole];
}

/**
 * 5. formatTokenUsage(usage)
 *
 * Formats token count and cost into a human-readable string for UI display.
 *
 * @param usage - The TokenCount object to format
 * @returns A string like "5.2k tokens ($0.05)"
 */
export function formatTokenUsage(usage: TokenCount): string {
  const tokens = formatCount(usage.totalTokens);
  const cost = formatCost(usage.totalCost);

  return `${tokens} tokens (${cost})`;
}

/**
 * Internal helper to format large numbers to "k" or "M" suffixes.
 */
function formatCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
  return `${(count / 1000000).toFixed(2)}M`;
}

/**
 * Helper to get the total summary of usage for debugging or logs.
 */
export function getUsageSummaryString(state: GraphState): string {
  const usage = state.tokenUsage;
  const totalCost =
    usage.planner.total.totalCost +
    usage.programmer.total.totalCost +
    usage.reviewer.total.totalCost +
    usage.manager.total.totalCost;

  return `Total Usage: ${formatCost(totalCost)} | Planner: ${formatTokenUsage(
    usage.planner.total
  )} | Programmer: ${formatTokenUsage(usage.programmer.total)}`;
}
