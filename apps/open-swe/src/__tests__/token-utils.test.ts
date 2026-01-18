import {
  updateTokenUsage,
  checkBudgetLimit,
  addBudgetWarning,
  getTokenUsageByAgent,
  formatTokenUsage,
} from "../utils/token-utils.js";
import {
  GraphState,
  createInitialTokenBreakdown,
  BudgetWarning,
} from "@openswe/shared/open-swe/types";

describe("token-utils", () => {
  let mockState: GraphState;

  beforeEach(() => {
    // Basic mock of the LangGraph state
    mockState = {
      messages: [],
      internalMessages: [],
      tokenUsage: createInitialTokenBreakdown(),
      budgetSettings: {
        maxBudget: 10.0,
        warningThreshold: 0.8,
        hardStop: false,
        currency: "$",
      },
      budgetWarnings: [],
      taskPlan: { tasks: [], activeTaskIndex: 0 },
      contextGatheringNotes: "",
      sandboxSessionId: "",
      branchName: "",
      targetRepository: { owner: "", repo: "" },
      codebaseTree: "",
      documentCache: {},
      githubIssueId: 0,
      dependenciesInstalled: false,
      reviewsCount: 0,
    } as unknown as GraphState;
  });

  describe("updateTokenUsage", () => {
    it("should return a state update for the specified agent", () => {
      const update = {
        agentRole: "programmer" as const,
        tokenData: [
          {
            model: "claude-sonnet-4-5",
            inputTokens: 1000,
            outputTokens: 500,
            cacheCreationInputTokens: 0,
            cacheReadInputTokens: 0,
          },
        ],
        cost: { inputCost: 0.003, outputCost: 0.0075, totalCost: 0.0105 },
      };

      const result = updateTokenUsage(mockState, update);

      expect(result.tokenUsage).toBeDefined();
      expect(result.tokenUsage!.programmer.total.totalTokens).toBe(1500);
      expect(result.tokenUsage!.programmer.total.totalCost).toBe(0.0105);
    });
  });

  describe("checkBudgetLimit", () => {
    it("should return null if under budget", () => {
      const warning = checkBudgetLimit(mockState);
      expect(warning).toBeNull();
    });

    it("should return a warning if budget exceeded", () => {
      mockState.tokenUsage.programmer.total.totalCost = 11.0;
      const warning = checkBudgetLimit(mockState);

      expect(warning).not.toBeNull();
      expect(warning?.severity).toBe("critical");
    });
  });

  describe("addBudgetWarning", () => {
    it("should return a partial update with the new warning", () => {
      const warning: BudgetWarning = {
        currentSpend: 8.5,
        budgetLimit: 10.0,
        percentageUsed: 85,
        message: "Approaching budget",
        severity: "warning",
        timestamp: new Date().toISOString(),
      };

      const result = addBudgetWarning(mockState, warning);

      expect(result.budgetWarnings).toHaveLength(1);
      expect(result.budgetWarnings![0]).toEqual(warning);
    });

    it("should not return a warning if it is a duplicate within 1 minute", () => {
      const now = new Date().toISOString();
      const warning: BudgetWarning = {
        currentSpend: 8.5,
        budgetLimit: 10.0,
        percentageUsed: 85,
        message: "Approaching budget",
        severity: "warning",
        timestamp: now,
      };

      mockState.budgetWarnings = [warning];

      const result = addBudgetWarning(mockState, {
        ...warning,
        timestamp: new Date(Date.now() + 30000).toISOString(), // 30 seconds later
      });

      expect(result).toEqual({});
    });
  });

  describe("getTokenUsageByAgent", () => {
    it("should return usage for the specific agent", () => {
      mockState.tokenUsage.planner.total.totalTokens = 1234;
      const usage = getTokenUsageByAgent(mockState, "planner");
      expect(usage.total.totalTokens).toBe(1234);
    });
  });

  describe("formatTokenUsage", () => {
    it("should format tokens and cost correctly", () => {
      const usage = {
        totalTokens: 1500,
        totalCost: 0.0105,
      } as any;

      const formatted = formatTokenUsage(usage);
      expect(formatted).toBe("1.5k tokens ($0.01)");
    });
  });
});
