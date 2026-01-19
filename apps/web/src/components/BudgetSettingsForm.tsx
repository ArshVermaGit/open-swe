"use client";

import React, { useState } from "react";
import { 
  Settings2, 
  DollarSign, 
  Bell, 
  Save, 
  Zap, 
  ShieldCheck, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export interface BudgetSettings {
  maxBudget: number;
  warnAt70: boolean;
  pauseAt90: boolean;
  stopAt100: boolean;
}

export interface BudgetSettingsFormProps {
  /** Initial settings to populate the form */
  initialSettings?: BudgetSettings;
  /** Task ID if saving for a specific task */
  taskId?: string;
  /** Optional callback after successful save */
  onSave?: (settings: BudgetSettings) => void;
  className?: string;
}

const PRESETS = [
  { id: "quick", label: "Quick Fix", value: 0.5, desc: "Light debugging/research" },
  { id: "standard", label: "Standard", value: 2.0, desc: "Feature implementation" },
  { id: "complex", label: "Complex", value: 5.0, desc: "Large refactors/full tasks" },
  { id: "unlimited", label: "Unlimited", value: 0, desc: "No spend limit protection" },
];

export const BudgetSettingsForm: React.FC<BudgetSettingsFormProps> = ({
  initialSettings,
  taskId,
  onSave,
  className,
}) => {
  const [budget, setBudget] = useState<string>(
    initialSettings?.maxBudget?.toString() || "5.00"
  );
  const [warnAt70, setWarnAt70] = useState(initialSettings?.warnAt70 ?? true);
  const [pauseAt90, setPauseAt90] = useState(initialSettings?.pauseAt90 ?? true);
  const [stopAt100, setStopAt100] = useState(initialSettings?.stopAt100 ?? true);
  const [isSaving, setIsSaving] = useState(false);

  // Sync radio group with manual input
  const currentPresetId = PRESETS.find(p => p.value === parseFloat(budget))?.id || "custom";

  const handlePresetChange = (value: string) => {
    const preset = PRESETS.find(p => p.id === value);
    if (preset) {
      setBudget(preset.value.toString());
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericBudget = parseFloat(budget);

    if (isNaN(numericBudget) || numericBudget < 0) {
      toast.error("Invalid Budget", {
        description: "Please enter a valid positive number for the budget limit.",
      });
      return;
    }

    setIsSaving(true);
    const settings: BudgetSettings = {
      maxBudget: numericBudget,
      warnAt70,
      pauseAt90,
      stopAt100,
    };

    try {
      const endpoint = taskId ? `/api/tasks/${taskId}/budget` : "/api/tokens/budget";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      toast.success("Settings Saved", {
        description: `Budget updated to ${numericBudget === 0 ? "Unlimited" : `$${numericBudget.toFixed(2)}`}.`,
      });
      
      onSave?.(settings);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Error Saving", {
        description: "We couldn't update your budget preferences. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className={cn(
      "bg-card text-card-foreground border-border/50 max-w-md rounded-2xl border p-6 shadow-xl space-y-8",
      className
    )}>
      {/* Header */}
      <div className="space-y-1.5 border-b border-border/50 pb-4">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-widest italic">Budget Preferences</h2>
        </div>
        <p className="text-muted-foreground text-xs font-medium">Configure spend limits and operation guardrails.</p>
      </div>

      <div className="space-y-6">
        {/* Custom Budget Input */}
        <div className="space-y-3">
          <Label htmlFor="budget" className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
            Budget Per Task (USD)
          </Label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              <DollarSign className="h-4 w-4" />
            </div>
            <Input
              id="budget"
              type="number"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="pl-9 bg-muted/30 border-border/40 font-bold focus-visible:ring-primary shadow-inner"
              placeholder="5.00"
            />
          </div>
        </div>

        {/* Presets Grid */}
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Budget Presets</Label>
          <RadioGroup 
            value={currentPresetId} 
            onValueChange={handlePresetChange}
            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
          >
            {PRESETS.map((preset) => (
              <div key={preset.id} className="relative">
                <RadioGroupItem
                  value={preset.id}
                  id={preset.id}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={preset.id}
                  className="bg-card hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/3 flex cursor-pointer flex-col rounded-xl border border-border/50 p-3 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{preset.label}</span>
                    <span className="text-[10px] text-primary font-black uppercase tracking-tighter">
                      {preset.value === 0 ? "∞" : `$${preset.value}`}
                    </span>
                  </div>
                  <span className="text-muted-foreground mt-1 text-[9px] font-medium leading-tight">
                    {preset.desc}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Threshold Rules */}
        <div className="space-y-4 pt-2">
          <Label className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground flex items-center gap-1.5">
            <Bell className="h-3 w-3" />
            Notification Rules
          </Label>
          
          <div className="space-y-2">
            {[
              { id: "w70", checked: warnAt70, set: setWarnAt70, label: "Warn at 70%", desc: "Display Toast notification", icon: <Zap className="h-3 w-3" /> },
              { id: "p90", checked: pauseAt90, set: setPauseAt90, label: "Pause at 90%", desc: "Open Warning Modal", icon: <AlertCircle className="h-3 w-3" /> },
              { id: "s100", checked: stopAt100, set: setStopAt100, label: "Stop at 100%", desc: "Hard stop execution", icon: <ShieldCheck className="h-3 w-3" /> },
            ].map((rule) => (
              <div 
                key={rule.id} 
                className={cn(
                  "flex items-center space-x-3 rounded-lg border border-border/20 p-2.5 transition-colors",
                  rule.checked ? "bg-primary/2" : "opacity-60"
                )}
              >
                <Checkbox
                  id={rule.id}
                  checked={rule.checked}
                  onCheckedChange={(checked: boolean | "indeterminate") => rule.set(checked === true)}
                />
                <Label htmlFor={rule.id} className="flex flex-1 flex-col cursor-pointer">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    {rule.icon}
                    {rule.label}
                  </span>
                  <span className="text-muted-foreground text-[9px] font-medium">
                    {rule.desc}
                  </span>
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2">
        <Button 
          type="submit" 
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 group shadow-lg shadow-primary/20 bg-primary hover:opacity-90"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="font-black uppercase tracking-widest text-[11px] italic">Save Preferences</span>
            </>
          )}
        </Button>
        <p className="mt-3 text-center text-[9px] font-semibold text-muted-foreground uppercase tracking-widest leading-none">
          Preferences apply to {taskId ? "current task" : "all future tasks"}.
        </p>
      </div>
    </form>
  );
};
