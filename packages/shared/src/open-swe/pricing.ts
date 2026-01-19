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
  // Claude 3.5 Series (Legacy)
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

export const DEFAULT_PRICING: ModelPricing = {
  name: "Unknown Model",
  inputPricePerMTok: 3.0,
  outputPricePerMTok: 15.0,
  tier: "balanced",
};

// =============================================================================
// Utility Functions
// =============================================================================

export function getModelPricing(model: string): ModelPricing {
  return (MODEL_PRICING as Record<string, ModelPricing>)[model] ?? DEFAULT_PRICING;
}

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): CostResult {
  const pricing = getModelPricing(model);
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

export function formatCost(
  cost: number,
  options: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {}
): string {
  if (cost === 0) return "$0.00";
  const minDigits = options.minimumFractionDigits ?? 2;
  const maxDigits = options.maximumFractionDigits ?? (cost < 0.01 ? 6 : 2);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  }).format(cost);
}

export function estimateCostFromText(
  inputText: string,
  estimatedOutputRatio: number = 1.5,
  model: string = AnthropicModels.CLAUDE_SONNET_4_5
): CostResult {
  const estimatedInputTokens = Math.ceil(inputText.length / 4);
  const estimatedOutputTokens = Math.ceil(estimatedInputTokens * estimatedOutputRatio);
  return calculateCost(estimatedInputTokens, estimatedOutputTokens, model);
}

export function getAvailableModels(): AnthropicModelId[] {
  return (Object.keys(MODEL_PRICING) as AnthropicModelId[]).filter(
    (modelId) => !MODEL_PRICING[modelId].deprecated
  );
}

export function isValidModel(model: string): model is AnthropicModelId {
  return model in MODEL_PRICING;
}
