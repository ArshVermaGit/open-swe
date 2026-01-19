import {
  updateTokenBreakdown,
  checkBudgetLimits,
  mapModelNameToPricingKey,
  getTotalCost,
  getTotalTokens,
  createUsageSummary,
} from "../utils/llm-tracker.js";
import {
  TokenBreakdown,
  BudgetSettings,
  ModelTokenData,
  createInitialTokenBreakdown,
} from "@openswe/shared/open-swe/types";

describe("llm-tracker", () => {
  describe("mapModelNameToPricingKey", () => {
    it("should map Claude 4 series model names correctly", () => {
      expect(mapModelNameToPricingKey("claude-sonnet-4-5")).toBe(
        "claude-sonnet-4-5-20250514"
      );
      expect(mapModelNameToPricingKey("claude-opus-4-5")).toBe(
        "claude-opus-4-1-20250430"
      );
      expect(mapModelNameToPricingKey("claude-haiku-4")).toBe(
        "claude-haiku-4-20250401"
      );
    });

    it("should map Claude 3.5 series model names correctly", () => {
      expect(mapModelNameToPricingKey("claude-3-5-sonnet-latest")).toBe(
        "claude-3-5-sonnet-20241022"
      );
      expect(mapModelNameToPricingKey("claude-3-5-haiku-latest")).toBe(
        "claude-3-5-haiku-20241022"
      );
    });

    it("should return original name if no mapping exists", () => {
      expect(mapModelNameToPricingKey("unknown-model")).toBe("unknown-model");
      expect(mapModelNameToPricingKey("gpt-4")).toBe("gpt-4");
    });
  });

  describe("updateTokenBreakdown", () => {
    let breakdown: TokenBreakdown;

    beforeEach(() => {
      breakdown = createInitialTokenBreakdown();
    });

    it("should update token breakdown for programmer agent", () => {
      const tokenData: ModelTokenData[] = [
        {
          model: "claude-sonnet-4-5",
          inputTokens: 1000,
          outputTokens: 500,
          cacheCreationInputTokens: 100,
          cacheReadInputTokens: 50,
        },
      ];
      const cost = { inputCost: 0.003, outputCost: 0.0075, totalCost: 0.0105 };

      const updated = updateTokenBreakdown(
        breakdown,
        "programmer",
        tokenData,
        cost
      );

      expect(updated.programmer.total.inputTokens).toBe(1150); // 1000 + 100 + 50
      expect(updated.programmer.total.outputTokens).toBe(500);
      expect(updated.programmer.total.totalTokens).toBe(1650);
      expect(updated.programmer.total.inputCost).toBe(0.003);
      expect(updated.programmer.total.outputCost).toBe(0.0075);
      expect(updated.programmer.total.totalCost).toBe(0.0105);
    });

    it("should accumulate tokens across multiple updates", () => {
      const tokenData1: ModelTokenData[] = [
        {
          model: "claude-sonnet-4-5",
          inputTokens: 1000,
          outputTokens: 500,
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: 0,
        },
      ];
      const cost1 = { inputCost: 0.003, outputCost: 0.0075, totalCost: 0.0105 };

      const updated1 = updateTokenBreakdown(
        breakdown,
        "programmer",
        tokenData1,
        cost1
      );

      const tokenData2: ModelTokenData[] = [
        {
          model: "claude-sonnet-4-5",
          inputTokens: 2000,
          outputTokens: 1000,
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: 0,
        },
      ];
      const cost2 = { inputCost: 0.006, outputCost: 0.015, totalCost: 0.021 };

      const updated2 = updateTokenBreakdown(
        updated1,
        "programmer",
        tokenData2,
        cost2
      );

      expect(updated2.programmer.total.inputTokens).toBe(3000);
      expect(updated2.programmer.total.outputTokens).toBe(1500);
      expect(updated2.programmer.total.totalCost).toBe(0.0315);
    });

    it("should track usage by model within agent", () => {
      const tokenData: ModelTokenData[] = [
        {
          model: "claude-sonnet-4-5",
          inputTokens: 1000,
          outputTokens: 500,
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: 0,
        },
      ];
      const cost = { inputCost: 0.003, outputCost: 0.0075, totalCost: 0.0105 };

      const updated = updateTokenBreakdown(
        breakdown,
        "planner",
        tokenData,
        cost
      );

      expect(updated.planner.byModel["claude-sonnet-4-5"]).toBeDefined();
      expect(updated.planner.byModel["claude-sonnet-4-5"].totalTokens).toBe(
        1500
      );
    });

    it("should not affect other agents when updating one", () => {
      const tokenData: ModelTokenData[] = [
        {
          model: "claude-sonnet-4-5",
          inputTokens: 1000,
          outputTokens: 500,
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: 0,
        },
      ];
      const cost = { inputCost: 0.003, outputCost: 0.0075, totalCost: 0.0105 };

      const updated = updateTokenBreakdown(
        breakdown,
        "programmer",
        tokenData,
        cost
      );

      expect(updated.programmer.total.totalTokens).toBe(1500);
      expect(updated.planner.total.totalTokens).toBe(0);
      expect(updated.reviewer.total.totalTokens).toBe(0);
      expect(updated.manager.total.totalTokens).toBe(0);
    });
  });

  describe("checkBudgetLimits", () => {
    let breakdown: TokenBreakdown;
    let budgetSettings: BudgetSettings;

    beforeEach(() => {
      breakdown = createInitialTokenBreakdown();
      budgetSettings = {
        maxBudget: 10.0,
        warningThreshold: 0.8,
        hardStop: false,
        currency: "$",
      };
    });

    it("should return null when under budget threshold", () => {
      // Set some usage but under 80%
      breakdown.programmer.total.totalCost = 5.0; // 50% of $10

      const warning = checkBudgetLimits(breakdown, budgetSettings);
      expect(warning).toBeNull();
    });

    it("should return info warning when approaching threshold", () => {
      // Set usage to 80%
      breakdown.programmer.total.totalCost = 8.0;

      const warning = checkBudgetLimits(breakdown, budgetSettings);

      expect(warning).not.toBeNull();
      expect(warning?.severity).toBe("info");
      expect(warning?.percentageUsed).toBe(80);
    });

    it("should return warning when at 90%", () => {
      breakdown.programmer.total.totalCost = 9.0;

      const warning = checkBudgetLimits(breakdown, budgetSettings);

      expect(warning).not.toBeNull();
      expect(warning?.severity).toBe("warning");
      expect(warning?.percentageUsed).toBe(90);
    });

    it("should return critical warning when budget exceeded", () => {
      breakdown.programmer.total.totalCost = 10.0;

      const warning = checkBudgetLimits(breakdown, budgetSettings);

      expect(warning).not.toBeNull();
      expect(warning?.severity).toBe("critical");
      expect(warning?.percentageUsed).toBe(100);
      expect(warning?.message).toContain("exceeded");
    });

    it("should sum costs across all agents", () => {
      // Distribute cost across agents totaling 85%
      breakdown.planner.total.totalCost = 2.0;
      breakdown.programmer.total.totalCost = 3.0;
      breakdown.reviewer.total.totalCost = 2.5;
      breakdown.manager.total.totalCost = 1.0;
      // Total: 8.5 = 85%

      const warning = checkBudgetLimits(breakdown, budgetSettings);

      expect(warning).not.toBeNull();
      expect(warning?.currentSpend).toBe(8.5);
    });
  });

  describe("getTotalCost", () => {
    it("should sum costs across all agents", () => {
      const breakdown = createInitialTokenBreakdown();
      breakdown.planner.total.totalCost = 1.0;
      breakdown.programmer.total.totalCost = 2.0;
      breakdown.reviewer.total.totalCost = 0.5;
      breakdown.manager.total.totalCost = 0.25;

      expect(getTotalCost(breakdown)).toBe(3.75);
    });
  });

  describe("getTotalTokens", () => {
    it("should sum tokens across all agents", () => {
      const breakdown = createInitialTokenBreakdown();
      breakdown.planner.total.totalTokens = 1000;
      breakdown.programmer.total.totalTokens = 5000;
      breakdown.reviewer.total.totalTokens = 2000;
      breakdown.manager.total.totalTokens = 500;

      expect(getTotalTokens(breakdown)).toBe(8500);
    });
  });

  describe("createUsageSummary", () => {
    it("should create a summary with all agents", () => {
      const breakdown = createInitialTokenBreakdown();
      breakdown.planner.total.totalTokens = 1000;
      breakdown.planner.total.totalCost = 0.05;
      breakdown.programmer.total.totalTokens = 5000;
      breakdown.programmer.total.totalCost = 0.25;

      const summary = createUsageSummary(breakdown);

      expect(summary.byAgent.planner.tokens).toBe(1000);
      expect(summary.byAgent.programmer.tokens).toBe(5000);
      expect(summary.total.tokens).toBe(6000);
    });
  });
});
