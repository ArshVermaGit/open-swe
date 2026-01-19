"use client";

import React, { useState } from "react";
import { 
  ChevronDown, 
  ChevronRight, 
  ListChecks, 
  AlertCircle,
  Coins
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface OperationUsage {
  id: string;
  name: string;
  tokens: number;
  cost: number;
  isExpensive?: boolean;
}

export interface PhaseBreakdown {
  id: string;
  title: string;
  icon?: React.ReactNode;
  operations: OperationUsage[];
  totalTokens: number;
  totalCost: number;
}

export interface TokenBreakdownProps {
  phases: PhaseBreakdown[];
  grandTotalTokens: number;
  grandTotalCost: number;
  className?: string;
}

/**
 * TokenBreakdown Component
 * 
 * Displays a detailed, hierarchical breakdown of token usage by agent phase and operation.
 */
export const TokenBreakdown: React.FC<TokenBreakdownProps> = ({
  phases,
  grandTotalTokens,
  grandTotalCost,
  className,
}) => {
  const [openPhases, setOpenPhases] = useState<Record<string, boolean>>(
    Object.fromEntries(phases.map((p) => [p.id, true]))
  );

  const togglePhase = (id: string) => {
    setOpenPhases((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatNumber = (num: number) => num.toLocaleString("en-US");
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  return (
    <div className={cn(
      "bg-card text-card-foreground border-border/50 w-full rounded-xl border shadow-sm",
      className
    )}>
      {/* Header */}
      <div className="border-border/50 flex items-center gap-2 border-b px-5 py-4">
        <div className="bg-primary/10 rounded-lg p-1.5 text-primary">
          <ListChecks className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider">Token Breakdown</h3>
      </div>

      <div className="p-4 space-y-4">
        {phases.map((phase) => (
          <Collapsible
            key={phase.id}
            open={openPhases[phase.id]}
            onOpenChange={() => togglePhase(phase.id)}
            className="space-y-1"
          >
            <CollapsibleTrigger className="group hover:bg-muted/50 flex w-full items-center justify-between rounded-md px-2 py-1.5 transition-colors">
              <div className="flex items-center gap-2">
                {openPhases[phase.id] ? (
                  <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />
                )}
                <span className="text-sm font-bold">{phase.title}</span>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground text-[10px] font-medium mr-2">
                  {formatNumber(phase.totalTokens)} tokens
                </span>
                <span className="text-xs font-bold">{formatCurrency(phase.totalCost)}</span>
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-0.5 pl-7 pr-2">
              {phase.operations.map((op, idx) => {
                const isLast = idx === phase.operations.length - 1;
                return (
                  <div key={op.id} className="group relative flex items-center justify-between py-1.5">
                    {/* Tree Connection Lines */}
                    <div className="absolute -left-4 top-0 bottom-0 w-4">
                      <div className={cn(
                        "absolute left-0 top-0 border-l border-border",
                        isLast ? "h-3" : "h-full"
                      )} />
                      <div className="absolute left-0 top-3 w-3 border-t border-border" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs",
                        op.isExpensive ? "text-amber-500 font-medium" : "text-muted-foreground"
                      )}>
                        {op.name}
                      </span>
                      {op.isExpensive && (
                        <div className="flex items-center gap-0.5 bg-amber-500/10 px-1 rounded text-[8px] text-amber-500 uppercase font-bold animate-pulse">
                          <AlertCircle className="h-2 w-2" />
                          <span>Expensive</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-[10px] tabular-nums">
                        {formatNumber(op.tokens)}
                      </span>
                      <span className="text-[11px] font-medium tabular-nums min-w-[50px] text-right">
                        {formatCurrency(op.cost)}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {/* Branch termination line if collapsed? (Handled by isLast above) */}
              <div className="flex justify-between border-t border-border/50 mt-1 pt-1.5 opacity-60">
                <span className="text-[10px] font-bold uppercase tracking-tighter">Phase Total</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold">{formatNumber(phase.totalTokens)}</span>
                  <span className="text-[10px] font-bold">{formatCurrency(phase.totalCost)}</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      {/* Grand Total Footer */}
      <div className="bg-primary/3 border-t border-border/50 px-5 py-4 rounded-b-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="text-primary h-4 w-4" />
            <span className="text-sm font-black uppercase tracking-widest italic">Grand Total</span>
          </div>
          <div className="text-right">
            <div className="text-primary text-lg font-black tracking-tight leading-none">
              {formatCurrency(grandTotalCost)}
            </div>
            <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-tighter">
              Across {formatNumber(grandTotalTokens)} tokens
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
