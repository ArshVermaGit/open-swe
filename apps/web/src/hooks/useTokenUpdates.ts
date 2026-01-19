import { useState, useEffect } from "react";
import { TokenBreakdown, createInitialTokenBreakdown, TokenUsage } from "@openswe/shared/open-swe/types";

/**
 * Custom event payload structure for token updates
 */
export interface TokenUpdateEvent {
  model: string;
  agentRole: "planner" | "programmer" | "reviewer" | "manager";
  inputTokens: number;
  outputTokens: number;
  cost: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
  };
  timestamp: string;
}

/**
 * useTokenUpdates Hook
 * 
 * Subscribes to 'token-update' custom events from a LangGraph stream and 
 * maintains a real-time aggregate of token usage.
 * 
 * @param onCustomEvent - Pass this to the useStream 'onCustomEvent' callback
 * @returns { realTimeBreakdown, resetUsage }
 */
export function useTokenUpdates() {
  const [realTimeBreakdown, setRealTimeBreakdown] = useState<TokenBreakdown>(
    createInitialTokenBreakdown()
  );

  const handleUpdate = (event: any) => {
    // Only process 'token-update' events
    if (event.type !== "token-update") return;

    const data = event.payload as TokenUpdateEvent;
    const { agentRole, inputTokens, outputTokens, cost } = data;

    setRealTimeBreakdown((prev) => {
      const agentUsage = prev[agentRole];
      
      const newTotal = {
        inputTokens: agentUsage.total.inputTokens + inputTokens,
        outputTokens: agentUsage.total.outputTokens + outputTokens,
        totalTokens: agentUsage.total.totalTokens + inputTokens + outputTokens,
        inputCost: agentUsage.total.inputCost + cost.inputCost,
        outputCost: agentUsage.total.outputCost + cost.outputCost,
        totalCost: agentUsage.total.totalCost + cost.totalCost,
        timestamp: data.timestamp,
      };

      // Simple model-specific aggregation
      const newByModel = { ...agentUsage.byModel };
      const modelKey = data.model;
      const existingModelUsage = newByModel[modelKey] || {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        timestamp: data.timestamp,
      };

      newByModel[modelKey] = {
        inputTokens: existingModelUsage.inputTokens + inputTokens,
        outputTokens: existingModelUsage.outputTokens + outputTokens,
        totalTokens: existingModelUsage.totalTokens + inputTokens + outputTokens,
        inputCost: existingModelUsage.inputCost + cost.inputCost,
        outputCost: existingModelUsage.outputCost + cost.outputCost,
        totalCost: existingModelUsage.totalCost + cost.totalCost,
        timestamp: data.timestamp,
      };

      return {
        ...prev,
        [agentRole]: {
          ...agentUsage,
          total: newTotal,
          byModel: newByModel,
          lastUpdated: data.timestamp,
        },
      };
    });
  };

  const resetUsage = () => {
    setRealTimeBreakdown(createInitialTokenBreakdown());
  };

  return {
    realTimeBreakdown,
    handleUpdate,
    resetUsage,
  };
}
