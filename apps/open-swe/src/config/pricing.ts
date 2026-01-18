/**
 * Anthropic Model Pricing Configuration
 *
 * This module provides pricing information for Anthropic Claude models
 * and utility functions for calculating costs based on token usage.
 *
 * Prices are in USD per 1 million tokens.
 * Last updated: January 2026
 *
 * @see https://www.anthropic.com/pricing
 */

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Supported Anthropic model identifiers.
 * Use these constants for type-safe model references.
 */
export const AnthropicModels = {
  // Claude 4 Series
  CLAUDE_SONNET_4_5: "claude-sonnet-4-5-20250514",
  CLAUDE_OPUS_4_1: "claude-opus-4-1-20250430",
  CLAUDE_HAIKU_4: "claude-haiku-4-20250401",

  // Claude 3.5 Series (Legacy)
  CLAUDE_3_5_SONNET: "claude-3-5-sonnet-20241022",
  CLAUDE_3_5_HAIKU: "claude-3-5-haiku-20241022",

  // Claude 3 Series (Legacy)
  CLAUDE_3_OPUS: "claude-3-opus-20240229",
  CLAUDE_3_SONNET: "claude-3-sonnet-20240229",
  CLAUDE_3_HAIKU: "claude-3-haiku-20240307",
} as const;

/** Union type of all supported model identifiers */
export type AnthropicModelId =
  (typeof AnthropicModels)[keyof typeof AnthropicModels];

/**
 * Pricing structure for a single model.
 * All prices are in USD per 1 million tokens.
 */
export interface ModelPricing {
  /** Human-readable model name */
  readonly name: string;
  /** Price per 1 million input tokens (USD) */
  readonly inputPricePerMTok: number;
  /** Price per 1 million output tokens (USD) */
  readonly outputPricePerMTok: number;
  /** Model tier for categorization */
  readonly tier: "flagship" | "balanced" | "instant";
  /** Whether this model is deprecated */
  readonly deprecated?: boolean;
}

/**
 * Complete pricing configuration mapping model IDs to their pricing.
 */
export type PricingConfig = Record<AnthropicModelId, ModelPricing>;

/**
 * Result of a cost calculation.
 */
export interface CostResult {
  /** Cost for input tokens in USD */
  inputCost: number;
  /** Cost for output tokens in USD */
  outputCost: number;
  /** Total cost (input + output) in USD */
  totalCost: number;
  /** Model used for calculation */
  model: string;
  /** Token counts used */
  tokens: {
    input: number;
    output: number;
    total: number;
  };
}

// =============================================================================
// Pricing Configuration
// =============================================================================

/**
 * Current pricing for all supported Anthropic models.
 *
 * To update prices:
 * 1. Check https://www.anthropic.com/pricing for current rates
 * 2. Update the relevant `inputPricePerMTok` and `outputPricePerMTok` values
 * 3. Update the "Last updated" date in the module header
 */
export const MODEL_PRICING: PricingConfig = {
  // -------------------------------------------------------------------------
  // Claude 4 Series (Current Generation)
  // -------------------------------------------------------------------------

  [AnthropicModels.CLAUDE_SONNET_4_5]: {
    name: "Claude Sonnet 4.5",
    inputPricePerMTok: 3.0,
    outputPricePerMTok: 15.0,
    tier: "balanced",
  },

  [AnthropicModels.CLAUDE_OPUS_4_1]: {
    name: "Claude Opus 4.1",
    inputPricePerMTok: 15.0,
    outputPricePerMTok: 75.0,
    tier: "flagship",
  },

  [AnthropicModels.CLAUDE_HAIKU_4]: {
    name: "Claude Haiku 4",
    inputPricePerMTok: 0.25,
    outputPricePerMTok: 1.25,
    tier: "instant",
  },

  // -------------------------------------------------------------------------
  // Claude 3.5 Series (Previous Generation)
  // -------------------------------------------------------------------------

  [AnthropicModels.CLAUDE_3_5_SONNET]: {
    name: "Claude 3.5 Sonnet",
    inputPricePerMTok: 3.0,
    outputPricePerMTok: 15.0,
    tier: "balanced",
    deprecated: true,
  },

  [AnthropicModels.CLAUDE_3_5_HAIKU]: {
    name: "Claude 3.5 Haiku",
    inputPricePerMTok: 0.8,
    outputPricePerMTok: 4.0,
    tier: "instant",
    deprecated: true,
  },

  // -------------------------------------------------------------------------
  // Claude 3 Series (Legacy)
  // -------------------------------------------------------------------------

  [AnthropicModels.CLAUDE_3_OPUS]: {
    name: "Claude 3 Opus",
    inputPricePerMTok: 15.0,
    outputPricePerMTok: 75.0,
    tier: "flagship",
    deprecated: true,
  },

  [AnthropicModels.CLAUDE_3_SONNET]: {
    name: "Claude 3 Sonnet",
    inputPricePerMTok: 3.0,
    outputPricePerMTok: 15.0,
    tier: "balanced",
    deprecated: true,
  },

  [AnthropicModels.CLAUDE_3_HAIKU]: {
    name: "Claude 3 Haiku",
    inputPricePerMTok: 0.25,
    outputPricePerMTok: 1.25,
    tier: "instant",
    deprecated: true,
  },
};

/**
 * Default pricing used when a model is not found in the configuration.
 * Uses Claude Sonnet 4.5 pricing as a reasonable default.
 */
export const DEFAULT_PRICING: ModelPricing = {
  name: "Unknown Model",
  inputPricePerMTok: 3.0,
  outputPricePerMTok: 15.0,
  tier: "balanced",
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Retrieves pricing information for a given model.
 *
 * @param model - Model identifier string
 * @returns ModelPricing object for the specified model, or DEFAULT_PRICING if not found
 *
 * @example
 * ```typescript
 * const pricing = getModelPricing(AnthropicModels.CLAUDE_SONNET_4_5);
 * console.log(pricing.inputPricePerMTok); // 3.0
 * ```
 */
export function getModelPricing(model: string): ModelPricing {
  return (MODEL_PRICING as Record<string, ModelPricing>)[model] ?? DEFAULT_PRICING;
}

/**
 * Calculates the cost in USD for a given token usage and model.
 *
 * @param inputTokens - Number of input/prompt tokens
 * @param outputTokens - Number of output/completion tokens
 * @param model - Model identifier string
 * @returns CostResult object with detailed cost breakdown
 *
 * @example
 * ```typescript
 * // Calculate cost for Claude Sonnet 4.5
 * const result = calculateCost(100_000, 50_000, AnthropicModels.CLAUDE_SONNET_4_5);
 * console.log(result.totalCost); // 1.05
 *
 * // With string model ID
 * const result2 = calculateCost(1_000_000, 100_000, "claude-sonnet-4-5-20250514");
 * console.log(result2.totalCost); // 4.5
 * ```
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): CostResult {
  const pricing = getModelPricing(model);

  // Calculate cost: (tokens / 1,000,000) * price_per_million
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPricePerMTok;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPricePerMTok;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    model,
    tokens: {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens,
    },
  };
}

/**
 * Formats a cost number to a currency string.
 *
 * @param cost - Cost in USD
 * @param options - Formatting options
 * @returns Formatted currency string
 *
 * @example
 * ```typescript
 * formatCost(1.05);           // "$1.05"
 * formatCost(0.005);          // "$0.0050"
 * formatCost(0.00012);        // "$0.000120"
 * formatCost(1234.56);        // "$1,234.56"
 * ```
 */
export function formatCost(
  cost: number,
  options: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {}
): string {
  if (cost === 0) return "$0.00";

  // Determine appropriate precision based on value
  let minDigits = options.minimumFractionDigits ?? 2;
  let maxDigits = options.maximumFractionDigits ?? (cost < 0.01 ? 6 : 2);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  }).format(cost);
}

/**
 * Estimates the cost for a given text input before making an API call.
 * Uses an approximate token count (1 token ≈ 4 characters for English text).
 *
 * @param inputText - The text to be sent as input
 * @param estimatedOutputRatio - Ratio of output tokens to input tokens (default: 1.5)
 * @param model - Model identifier string
 * @returns Estimated CostResult
 *
 * @example
 * ```typescript
 * const estimate = estimateCostFromText(
 *   "Explain quantum computing in simple terms.",
 *   2.0, // Expect output to be 2x input length
 *   AnthropicModels.CLAUDE_SONNET_4_5
 * );
 * console.log(formatCost(estimate.totalCost));
 * ```
 */
export function estimateCostFromText(
  inputText: string,
  estimatedOutputRatio: number = 1.5,
  model: string = AnthropicModels.CLAUDE_SONNET_4_5
): CostResult {
  // Approximate token count: ~4 characters per token for English
  const estimatedInputTokens = Math.ceil(inputText.length / 4);
  const estimatedOutputTokens = Math.ceil(estimatedInputTokens * estimatedOutputRatio);

  return calculateCost(estimatedInputTokens, estimatedOutputTokens, model);
}

/**
 * Gets a list of all available (non-deprecated) models.
 *
 * @returns Array of model IDs that are not deprecated
 */
export function getAvailableModels(): AnthropicModelId[] {
  return (Object.keys(MODEL_PRICING) as AnthropicModelId[]).filter(
    (modelId) => !MODEL_PRICING[modelId].deprecated
  );
}

/**
 * Gets a list of all deprecated models.
 *
 * @returns Array of deprecated model IDs
 */
export function getDeprecatedModels(): AnthropicModelId[] {
  return (Object.keys(MODEL_PRICING) as AnthropicModelId[]).filter(
    (modelId) => MODEL_PRICING[modelId].deprecated
  );
}

/**
 * Checks if a model ID is valid and supported.
 *
 * @param model - Model identifier to check
 * @returns true if the model is in the pricing configuration
 */
export function isValidModel(model: string): model is AnthropicModelId {
  return model in MODEL_PRICING;
}

/**
 * Compares costs between two models for the same token usage.
 *
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @param modelA - First model to compare
 * @param modelB - Second model to compare
 * @returns Comparison object with costs and savings
 *
 * @example
 * ```typescript
 * const comparison = compareCosts(
 *   100_000, 50_000,
 *   AnthropicModels.CLAUDE_OPUS_4_1,
 *   AnthropicModels.CLAUDE_SONNET_4_5
 * );
 * console.log(`Savings: ${formatCost(comparison.savings)}`);
 * console.log(`${comparison.savingsPercent.toFixed(1)}% cheaper with ${comparison.cheaperModel}`);
 * ```
 */
export function compareCosts(
  inputTokens: number,
  outputTokens: number,
  modelA: string,
  modelB: string
): {
  costA: CostResult;
  costB: CostResult;
  cheaperModel: string;
  savings: number;
  savingsPercent: number;
} {
  const costA = calculateCost(inputTokens, outputTokens, modelA);
  const costB = calculateCost(inputTokens, outputTokens, modelB);

  const cheaperModel = costA.totalCost <= costB.totalCost ? modelA : modelB;
  const savings = Math.abs(costA.totalCost - costB.totalCost);
  const maxCost = Math.max(costA.totalCost, costB.totalCost);
  const savingsPercent = maxCost > 0 ? (savings / maxCost) * 100 : 0;

  return {
    costA,
    costB,
    cheaperModel,
    savings,
    savingsPercent,
  };
}
