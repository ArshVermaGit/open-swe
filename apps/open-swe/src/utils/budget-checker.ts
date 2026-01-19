/**
 * Advanced Budget Checking Logic
 *
 * This module provides logic to evaluate LLM spend against budget thresholds
 * and determine the appropriate action (CONTINUE, WARN, PAUSE, STOP).
 *
 * @module budget-checker
 */

import { BudgetSettings } from "@openswe/shared/open-swe/types";
import { formatCost } from "../config/pricing.js";

/**
 * Valid actions to take based on budget state.
 */
export enum BudgetAction {
  /** Everything is fine, proceed normally. */
  CONTINUE = "CONTINUE",
  /** Threshold reached, notify user but proceed. */
  WARN = "WARN",
  /** Near limit, pause for user confirmation. */
  PAUSE = "PAUSE",
  /** Limit exceeded, stop all operations. */
  STOP = "STOP",
}

/**
 * Detailed result of a budget check.
 */
export interface BudgetCheckResult {
  /** The specific action recommended */
  action: BudgetAction;
  /** Percentage of budget consumed (0-100+) */
  percentageUsed: number;
  /** Current spend in USD */
  currentSpend: number;
  /** Maximum allowed budget in USD */
  maxBudget: number;
  /** User-friendly message describing the state */
  message: string;
  /** Whether the budget is "unlimited" (0) */
  isUnlimited: boolean;
}

/**
 * Thresholds for different budget actions.
 * These can also be passed in from configuration.
 */
export const BUDGET_THRESHOLDS = {
  WARNING: 0.7, // 70% - Start warning the user
  PAUSE: 0.9,   // 90% - Pause for manual review
  STOP: 1.0,    // 100% - Hard stop
};

/**
 * Determines the appropriate action based on total cost and settings.
 *
 * @param totalCost - The cumulative cost spent so far
 * @param settings - User-defined budget settings
 * @returns A BudgetCheckResult with recommended action
 */
export function getBudgetAction(
  totalCost: number,
  settings: BudgetSettings
): BudgetCheckResult {
  const { maxBudget, warningThreshold = BUDGET_THRESHOLDS.WARNING } = settings;

  // Handle Unlimited Budget (maxBudget = 0)
  if (maxBudget <= 0) {
    return {
      action: BudgetAction.CONTINUE,
      percentageUsed: 0,
      currentSpend: totalCost,
      maxBudget: 0,
      message: `Unlimited budget: ${formatCost(totalCost)} spent so far.`,
      isUnlimited: true,
    };
  }

  const percentageUsed = (totalCost / maxBudget) * 100;
  const ratio = totalCost / maxBudget;

  let action = BudgetAction.CONTINUE;
  let message = "";

  if (ratio >= BUDGET_THRESHOLDS.STOP) {
    action = BudgetAction.STOP;
    message = `CRITICAL: Budget limit exceeded! ${formatCost(totalCost)} / ${formatCost(maxBudget)} used.`;
  } else if (ratio >= BUDGET_THRESHOLDS.PAUSE) {
    action = BudgetAction.PAUSE;
    message = `CAUTION: Budget near limit! ${formatCost(totalCost)} / ${formatCost(maxBudget)} used (${percentageUsed.toFixed(1)}%). Reaching pause threshold.`;
  } else if (ratio >= warningThreshold) {
    action = BudgetAction.WARN;
    message = `NOTICE: Budget threshold reached: ${formatCost(totalCost)} / ${formatCost(maxBudget)} used (${percentageUsed.toFixed(1)}%).`;
  } else {
    action = BudgetAction.CONTINUE;
    message = `Budget status: healthy (${percentageUsed.toFixed(1)}% used).`;
  }

  return {
    action,
    percentageUsed,
    currentSpend: totalCost,
    maxBudget,
    message,
    isUnlimited: false,
  };
}

/**
 * Generates a specific user-friendly notification based on the budget result.
 *
 * @param result - The output from getBudgetAction
 * @returns A formatted message string or null if no action needed
 */
export function generateBudgetMessage(result: BudgetCheckResult): string {
  switch (result.action) {
    case BudgetAction.STOP:
      return `🛑 BUDGET HARD LIMIT REACHED: You have spent ${formatCost(result.currentSpend)} which exceeds your limit of ${formatCost(result.maxBudget)}. Operations have been halted to prevent overspending.`;
    case BudgetAction.PAUSE:
      return `⚠️ BUDGET PAUSE: You have consumed ${result.percentageUsed.toFixed(0)}% of your budget (${formatCost(result.currentSpend)}). Please review your plan before continuing.`;
    case BudgetAction.WARN:
      return `💡 BUDGET WARNING: You have used ${result.percentageUsed.toFixed(0)}% of your allocated budget.`;
    case BudgetAction.CONTINUE:
    default:
      if (result.isUnlimited) return "∞ Budget is unlimited.";
      return `✅ Budget: ${result.percentageUsed.toFixed(0)}% used.`;
  }
}
