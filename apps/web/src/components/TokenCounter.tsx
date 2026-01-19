"use client";

import React from "react";
import { Coins, Zap, TrendingUp, BarChart3, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface TokenCounterProps {
  /** Number of input tokens consumed */
  inputTokens: number;
  /** Number of output tokens consumed */
  outputTokens: number;
  /** Cost of input tokens in USD */
  inputCost: number;
  /** Cost of output tokens in USD */
  outputCost: number;
  /** Maximum budget in USD */
  maxBudget: number;
  /** Current total spend in USD */
  currentSpend: number;
  /** Optional additional class names for the container */
  className?: string;
}

/**
 * TokenCounter Component
 * 
 * A clean, modern dashboard for tracking LLM token usage and budget in real-time.
 */
export const TokenCounter: React.FC<TokenCounterProps> = ({
  inputTokens,
  outputTokens,
  inputCost,
  outputCost,
  maxBudget,
  currentSpend,
  className,
}) => {
  const totalTokens = inputTokens + outputTokens;
  const budgetPercentage = maxBudget > 0 ? (currentSpend / maxBudget) * 100 : 0;
  
  // Formatters
  const formatNumber = (num: number) => num.toLocaleString("en-US");
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);

  // Progress bar color logic
  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
    if (percentage >= 70) return "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]";
    return "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]";
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-500 font-bold";
    if (percentage >= 70) return "text-yellow-600 font-semibold";
    return "text-green-600 font-semibold";
  };

  return (
    <div className={cn(
      "bg-card text-card-foreground border-border/50 w-full max-w-md rounded-xl border shadow-lg backdrop-blur-sm",
      className
    )}>
      {/* Header */}
      <div className="border-border/50 flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-lg p-1.5 text-primary">
            <Coins className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold tracking-tight">Token Usage</h3>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">Real-time usage metrics and budget tracking for the current task.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-5 p-5">
        {/* Token Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-1">
          {/* Input Tokens */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-blue-500/10 rounded-md p-1.5 text-blue-500">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Input</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold">{formatNumber(inputTokens)}</span>
              <span className="text-muted-foreground ml-1.5 text-xs">({formatCurrency(inputCost)})</span>
            </div>
          </div>

          {/* Output Tokens */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-500/10 rounded-md p-1.5 text-emerald-500">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Output</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold">{formatNumber(outputTokens)}</span>
              <span className="text-muted-foreground ml-1.5 text-xs">({formatCurrency(outputCost)})</span>
            </div>
          </div>

          {/* Total Tokens (Separator) */}
          <div className="border-border/50 my-1 border-t pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-purple-500/10 rounded-md p-1.5 text-purple-500">
                  <BarChart3 className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-bold">Total</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold">{formatNumber(totalTokens)}</span>
                <span className="text-primary ml-1.5 text-xs font-bold">({formatCurrency(currentSpend)})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-end justify-between">
            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-widest">Budget Status</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold">{formatCurrency(currentSpend)}</span>
                <span className="text-muted-foreground text-xs">/</span>
                <span className="text-muted-foreground text-xs font-medium">
                  {maxBudget > 0 ? formatCurrency(maxBudget) : "Unlimited"}
                </span>
              </div>
            </div>
            <span className={cn("text-xs tabular-nums", getPercentageColor(budgetPercentage))}>
              {budgetPercentage.toFixed(0)}%
            </span>
          </div>

          {/* Custom Progress Bar */}
          <div className="bg-muted relative h-2.5 w-full overflow-hidden rounded-full">
            <div 
              className={cn(
                "h-full transition-all duration-500 ease-out",
                getProgressBarColor(budgetPercentage)
              )}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
          
          {budgetPercentage >= 90 && (
            <p className="animate-pulse text-center text-[10px] font-bold text-red-500 uppercase tracking-tighter">
              ⚠️ Warning: Near budget limit
            </p>
          )}
        </div>
      </div>

      {/* Footer / Mobile Hint */}
      <div className="bg-muted/30 px-5 py-2.5">
        <p className="text-muted-foreground text-center text-[9px] font-medium italic">
          Values update in real-time as the agent processes requests.
        </p>
      </div>
    </div>
  );
};
