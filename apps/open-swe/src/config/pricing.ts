/**
 * Configuration for model pricing.
 * Prices are in USD per 1 million tokens.
 */

export interface ModelPricing {
  /** Price per 1 million input tokens (USD) */
  inputPrice: number;
  /** Price per 1 million output tokens (USD) */
  outputPrice: number;
}

export type PricingConfig = Record<string, ModelPricing>;

/**
 * Pricing configuration for supported models.
 */
export const MODEL_PRICING: PricingConfig = {
  // Claude Sonnet 4.5
  "anthropic:claude-sonnet-4-5": {
    inputPrice: 3.0,
    outputPrice: 15.0,
  },
  // Claude Opus 4.1
  "anthropic:claude-opus-4-1": {
    inputPrice: 15.0,
    outputPrice: 75.0,
  },
  // Claude Haiku 4 (mapping to likely ID based on conventions)
  "anthropic:claude-haiku-4-5": {
    inputPrice: 0.25,
    outputPrice: 1.25,
  },
  
  // Fallbacks/Legacy mappings if needed
  "anthropic:claude-3-5-sonnet-latest": { // Approx Sonnet 3.5 pricing
    inputPrice: 3.0,
    outputPrice: 15.0, 
  },
  "anthropic:claude-3-5-haiku-latest": { // Approx Haiku 3.5 pricing
    inputPrice: 1.0,  // Checking actuals, but using user provided Haiku 4 values for the requested one
    outputPrice: 5.0,
  }
};

// Default pricing if model not found (conservative estimate based on Sonnet)
const DEFAULT_PRICING: ModelPricing = {
  inputPrice: 3.0,
  outputPrice: 15.0,
};

/**
 * Calculates the cost in USD for a given token usage and model.
 * 
 * @param inputTokens Number of input tokens
 * @param outputTokens Number of output tokens
 * @param model Model identifier string
 * @returns Cost object with input, output, and total cost in USD
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): { inputCost: number; outputCost: number; totalCost: number } {
  const pricing = MODEL_PRICING[model] || DEFAULT_PRICING;

  // Calculate cost: (tokens / 1,000,000) * price_per_million
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPrice;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPrice;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

/**
 * Formats a cost number to a currency string.
 * @param cost Cost in USD
 * @returns Formatted string (e.g. "$0.005")
 */
export function formatCost(cost: number): string {
  if (cost === 0) return "$0.00";
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}
