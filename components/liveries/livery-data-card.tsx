"use client";

import { useState } from "react";
import { Check, Copy, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface KeyValue {
  key: string;
  value: string;
}

interface LiveryDataCardProps {
  title?: string;
  keyValues: KeyValue[];
  advancedCustomization?: string;
  index: number;
  isOnlyVariation?: boolean;
}

export function LiveryDataCard({
  title,
  keyValues,
  advancedCustomization,
  index,
}: LiveryDataCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyValue = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    toast.success(`${key} copied`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Parse advanced customization
  const hasAdvanced = !!advancedCustomization;

  return (
    <div className="group rounded-2xl border border-border/40 bg-gradient-to-br from-card/80 to-card/40 p-5 transition-all duration-300 hover:border-border/60 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Title */}
        <p className="font-semibold text-foreground">
          {title || `Livery ${index + 1}`}
        </p>
      </div>

      {/* Key-Value pairs - each individually copyable */}
      <div className="space-y-1.5">
        {keyValues.map((kv, i) => (
          <button
            key={i}
            onClick={() => handleCopyValue(kv.key, kv.value)}
            className={cn(
              "w-full flex items-center justify-between gap-4 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-left group/item",
              copiedKey === kv.key
                ? "bg-green-500/10 ring-1 ring-green-500/20"
                : "bg-muted/40 hover:bg-muted/70",
            )}
          >
            <span className="text-muted-foreground font-medium shrink-0">
              {kv.key}
            </span>
            <code className="font-mono text-foreground truncate flex-1 text-right">
              {kv.value}
            </code>
            <div
              className={cn(
                "shrink-0 transition-all duration-200 opacity-0 group-hover/item:opacity-100",
                copiedKey === kv.key && "opacity-100 text-green-500",
              )}
            >
              {copiedKey === kv.key ? (
                <Check size={14} />
              ) : (
                <Copy size={14} className="text-muted-foreground" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Advanced Customization - Full display with copy */}
      {hasAdvanced && (
        <div className="mt-3 rounded-xl bg-primary/5 border border-primary/10 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-primary/10">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Advanced Customization
            </span>
            <button
              onClick={() =>
                handleCopyValue("Advanced", advancedCustomization!)
              }
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200",
                copiedKey === "Advanced"
                  ? "bg-green-500/15 text-green-600 dark:text-green-400"
                  : "text-primary hover:bg-primary/10",
              )}
            >
              {copiedKey === "Advanced" ? (
                <Check size={12} />
              ) : (
                <Copy size={12} />
              )}
              {copiedKey === "Advanced" ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="px-3 py-2.5 max-h-32 overflow-y-auto">
            <code className="font-mono text-xs text-foreground whitespace-pre-wrap break-all leading-relaxed">
              {advancedCustomization}
            </code>
          </div>
        </div>
      )}
    </div>
  );
}

// Section for all liveries - Single card with layers
interface LiveriesSectionProps {
  liveries: Array<{
    _id: string;
    title?: string;
    keyValues: KeyValue[];
    advancedCustomization?: string;
  }>;
  className?: string;
}

export function LiveriesSection({ liveries, className }: LiveriesSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const isPack = liveries.length > 1;
  const currentLivery = liveries[activeIndex];

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyValue = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    toast.success(`${key} copied`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const hasAdvanced = !!currentLivery.advancedCustomization;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          Livery Data
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card/80 to-card/40 overflow-hidden">
        {/* Card Header - Navigation for packs */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/30 bg-muted/20">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">
              {isPack
                ? currentLivery.title || `Livery ${activeIndex + 1}`
                : "Data"}
            </h3>
            {isPack && (
              <span className="text-xs text-muted-foreground shrink-0">
                {activeIndex + 1}/{liveries.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Pack navigation */}
            {isPack && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setActiveIndex((prev) =>
                      prev === 0 ? liveries.length - 1 : prev - 1,
                    )
                  }
                  className="p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() =>
                    setActiveIndex((prev) =>
                      prev === liveries.length - 1 ? 0 : prev + 1,
                    )
                  }
                  className="p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content area - natural height */}
        <div className="p-4">
          {/* Key-Value pairs */}
          <div className="space-y-1.5">
            {currentLivery.keyValues.map((kv, i) => (
              <button
                key={i}
                onClick={() => handleCopyValue(kv.key, kv.value)}
                className={cn(
                  "w-full flex items-center justify-between gap-4 px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left group/item",
                  copiedKey === kv.key
                    ? "bg-green-500/10 ring-1 ring-green-500/20"
                    : "bg-muted/40 hover:bg-muted/70",
                )}
              >
                <span className="text-muted-foreground font-medium shrink-0 text-xs">
                  {kv.key}
                </span>
                <code className="font-mono text-foreground truncate flex-1 text-right text-sm">
                  {kv.value}
                </code>
                <div
                  className={cn(
                    "shrink-0 transition-all duration-200 opacity-0 group-hover/item:opacity-100",
                    copiedKey === kv.key && "opacity-100 text-green-500",
                  )}
                >
                  {copiedKey === kv.key ? (
                    <Check size={12} />
                  ) : (
                    <Copy size={12} className="text-muted-foreground" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Advanced Customization */}
          {hasAdvanced && (
            <div className="mt-3 rounded-lg bg-primary/5 border border-primary/10 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-primary/10">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Advanced
                </span>
                <button
                  onClick={() =>
                    handleCopyValue(
                      "Advanced",
                      currentLivery.advancedCustomization!,
                    )
                  }
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-all duration-200",
                    copiedKey === "Advanced"
                      ? "bg-green-500/15 text-green-600 dark:text-green-400"
                      : "text-primary hover:bg-primary/10",
                  )}
                >
                  {copiedKey === "Advanced" ? (
                    <Check size={10} />
                  ) : (
                    <Copy size={10} />
                  )}
                  {copiedKey === "Advanced" ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="px-3 py-2 max-h-24 overflow-y-auto">
                <code className="font-mono text-xs text-foreground whitespace-pre-wrap break-all leading-relaxed">
                  {currentLivery.advancedCustomization}
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Pack indicator dots */}
        {isPack && (
          <div className="flex justify-center gap-1.5 py-2 border-t border-border/30 bg-muted/10">
            {liveries.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-200",
                  i === activeIndex
                    ? "bg-primary w-4"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
