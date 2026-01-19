import { TokenBreakdown, BudgetSettings, BudgetWarning } from "@openswe/shared/open-swe/types";

export interface TaskTokenUsageResponse {
  taskId: string;
  usage: TokenBreakdown;
  totalCost: number;
}

export interface TokenHistoryResponse {
  totalUsage: TokenBreakdown;
  taskBreakdown: Array<{
    taskId: string;
    title: string;
    usage: TokenBreakdown;
  }>;
}

export interface UpdateBudgetRequest {
  taskId: string;
  budgetSettings: Partial<BudgetSettings>;
}

export interface UpdateBudgetResponse {
  success: boolean;
  budgetSettings: BudgetSettings;
  warnings: BudgetWarning[];
}

export interface CostEstimateRequest {
  promptLength: number;
  modelName: string;
  expectedOutputLength?: number;
}

export interface CostEstimateResponse {
  estimatedCost: number;
  inputCost: number;
  outputCost: number;
  currency: string;
}
