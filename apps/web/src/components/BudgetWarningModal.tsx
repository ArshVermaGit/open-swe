"use client";

import React from "react";
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  TrendingUp, 
  PlusCircle, 
  Ban, 
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type BudgetThreshold = 70 | 90 | 100;

export interface BudgetWarningModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal is closed */
  onClose: () => void;
  /** The current budget threshold reached */
  threshold: BudgetThreshold;
  /** Current spend in USD */
  currentSpend: number;
  /** Maximum budget in USD */
  maxBudget: number;
  /** Callback for "Continue" action */
  onContinue: () => void;
  /** Callback for "Increase Limit" action */
  onIncreaseLimit: () => void;
  /** Callback for "Cancel Task" action */
  onCancel: () => void;
}

/**
 * BudgetWarningModal Component
 * 
 * An accessible modal dialog that alerts users when their task spend reaches critical thresholds.
 */
export const BudgetWarningModal: React.FC<BudgetWarningModalProps> = ({
  isOpen,
  onClose,
  threshold,
  currentSpend,
  maxBudget,
  onContinue,
  onIncreaseLimit,
  onCancel,
}) => {
  const percentage = maxBudget > 0 ? (currentSpend / maxBudget) * 100 : 0;
  
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);

  // Variant Configuration
  const variants = {
    70: {
      title: "Budget Warning (70%)",
      description: "Your task has consumed 70% of its allocated budget. Agent execution continues normally.",
      icon: <Info className="h-6 w-6 text-blue-500" />,
      bgColor: "bg-blue-500/10",
      progressColor: "bg-blue-500",
      accentText: "text-blue-600 dark:text-blue-400",
    },
    90: {
      title: "Critical Budget Limit (90%)",
      description: "Approaching budget limit. Exceeding the threshold may pause agent operations until the limit is increased.",
      icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
      bgColor: "bg-amber-500/10",
      progressColor: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
      accentText: "text-amber-600 dark:text-amber-400",
    },
    100: {
      title: "Budget Limit Reached (100%)",
      description: "Agent execution has been paused because the budget limit was reached. Please increase the limit to resume.",
      icon: <AlertCircle className="h-6 w-6 text-red-500" />,
      bgColor: "bg-red-500/10",
      progressColor: "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]",
      accentText: "text-red-600 dark:text-red-400 font-bold",
    },
  };

  const config = variants[threshold];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden rounded-2xl border-border/50 bg-card/95 backdrop-blur-md shadow-2xl p-0">
        <div className={cn("px-6 py-6 pb-2", config.bgColor)}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 dark:bg-black/20 rounded-xl shadow-inner border border-white/20">
              {config.icon}
            </div>
            <div>
              <DialogTitle className="text-xl font-black tracking-tight uppercase italic pb-0.5">
                {config.title}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs leading-relaxed font-medium">
                Spend Alert: {threshold}% Threshold Reached
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          <p className="text-sm font-medium leading-relaxed">
            {config.description}
          </p>

          {/* Usage Stats Card */}
          <div className="bg-muted/50 rounded-xl border border-border/40 p-4 space-y-3">
            <div className="flex justify-between items-end">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Spending</span>
                <div className="flex items-baseline gap-1.5">
                  <span className={cn("text-lg font-black", config.accentText)}>
                    {formatCurrency(currentSpend)}
                  </span>
                  <span className="text-muted-foreground text-xs font-medium">/ {formatCurrency(maxBudget)}</span>
                </div>
              </div>
              <span className={cn("text-xs font-black tabular-nums italic", config.accentText)}>
                {percentage.toFixed(0)}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="bg-muted relative h-2.5 w-full overflow-hidden rounded-full border border-border/20">
              <div 
                className={cn(
                  "h-full transition-all duration-1000 ease-in-out",
                  config.progressColor,
                  threshold >= 90 && "animate-pulse"
                )}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="text-xs font-medium text-center italic text-muted-foreground bg-muted/20 py-2 rounded-lg border border-dashed border-border/40">
            {threshold === 100 
              ? "Action required to resume agent execution." 
              : "Continuing now may lead to automatic pause at 100%."}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2 p-6 bg-muted/30 border-t border-border/50">
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button 
              variant="outline" 
              className="w-full flex items-center gap-2 border-border/50 hover:bg-destructive hover:text-destructive-foreground transition-all duration-300" 
              onClick={onCancel}
            >
              <Ban className="h-4 w-4" />
              <span>Cancel Task</span>
            </Button>
            <Button 
              className="w-full flex items-center gap-2 bg-primary hover:opacity-90 transition-all shadow-lg shadow-primary/20" 
              onClick={onIncreaseLimit}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Increase Limit</span>
            </Button>
          </div>
          
          {threshold < 100 && (
            <Button 
              variant="secondary"
              className="w-full flex items-center justify-center gap-2 group transition-all" 
              onClick={onContinue}
            >
              <Play className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              <span className="font-bold">Keep Running At This Limit</span>
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            className="w-full text-[10px] text-muted-foreground h-auto py-1" 
            onClick={onClose}
          >
            Dismiss Dialog
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
