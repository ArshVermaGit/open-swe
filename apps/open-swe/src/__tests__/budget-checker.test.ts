import { getBudgetAction, BudgetAction } from "../utils/budget-checker.js";
import { BudgetSettings } from "@openswe/shared/open-swe/types";

describe("budget-checker", () => {
  const settings: BudgetSettings = {
    maxBudget: 10.0,
    warningThreshold: 0.7,
    hardStop: true,
    currency: "$",
  };

  describe("getBudgetAction", () => {
    it("should return CONTINUE when spend is low", () => {
      const result = getBudgetAction(2.0, settings); // 20%
      expect(result.action).toBe(BudgetAction.CONTINUE);
      expect(result.percentageUsed).toBe(20);
    });

    it("should return WARN when spend exceeds 70%", () => {
      const result = getBudgetAction(7.1, settings); // 71%
      expect(result.action).toBe(BudgetAction.WARN);
      expect(result.message).toContain("threshold reached");
    });

    it("should return PAUSE when spend exceeds 90%", () => {
      const result = getBudgetAction(9.1, settings); // 91%
      expect(result.action).toBe(BudgetAction.PAUSE);
      expect(result.message).toContain("near limit");
    });

    it("should return STOP when spend exceeds 100%", () => {
      const result = getBudgetAction(10.5, settings); // 105%
      expect(result.action).toBe(BudgetAction.STOP);
      expect(result.message).toContain("limit exceeded");
    });

    it("should handle unlimited budget (maxBudget = 0)", () => {
      const unlimitedSettings = { ...settings, maxBudget: 0 };
      const result = getBudgetAction(1000.0, unlimitedSettings);
      expect(result.action).toBe(BudgetAction.CONTINUE);
      expect(result.isUnlimited).toBe(true);
      expect(result.message).toContain("Unlimited budget");
    });

    it("should allow custom warning thresholds", () => {
      const customSettings = { ...settings, warningThreshold: 0.5 };
      const result = getBudgetAction(5.1, customSettings); // 51%
      expect(result.action).toBe(BudgetAction.WARN);
    });
  });
});
