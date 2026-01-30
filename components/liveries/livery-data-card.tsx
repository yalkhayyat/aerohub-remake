"use client";

import { useState } from "react";
import { Layers, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CopyButton, CopyButtonWithLabel } from "./copy-button";
import { Button } from "@/components/ui/button";

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
  isOnlyVariation = false,
}: LiveryDataCardProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Format all key-values for "Copy All"
  const formatAllKeyValues = () => {
    return keyValues.map((kv) => `${kv.key}: ${kv.value}`).join("\n");
  };

  const handleCopyRow = async (value: string, index: number) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedIndex(index);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden shadow-sm hover:border-border transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-muted/20 border-b border-border/40">
        <h3 className="font-bold text-sm text-foreground/90 flex items-center gap-3">
          {!isOnlyVariation && (
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-[11px] font-black text-primary">
              {index + 1}
            </span>
          )}
          {title || "Configuration"}
        </h3>
        <CopyButtonWithLabel
          value={formatAllKeyValues()}
          label="Copy All"
          variant="ghost"
          size="sm"
          className="h-8 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/50"
        />
      </div>

      {/* Data Grid / Spec Sheet */}
      <div className="divide-y divide-border/20">
        {keyValues.map((kv, kvIndex) => (
          <div
            key={kvIndex}
            className="group flex items-center gap-8 px-5 py-3.5 hover:bg-muted/10 transition-colors"
          >
            {/* Key Column */}
            <div className="w-1/3 shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                {kv.key}
              </span>
            </div>

            {/* Value Column */}
            <div className="flex items-center justify-between flex-1 min-w-0">
              <code className="text-sm font-mono text-foreground/80 font-medium truncate select-all">
                {kv.value}
              </code>

              {/* Copy Action */}
              <button
                onClick={() => handleCopyRow(kv.value, kvIndex)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-md hover:bg-muted text-muted-foreground/40 hover:text-foreground"
                aria-label={`Copy ${kv.key}`}
              >
                {copiedIndex === kvIndex ? (
                  <Check size={14} className="text-emerald-500" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Customization (Always visible if present) */}
      {advancedCustomization && advancedCustomization.trim() !== "" && (
        <div className="border-t border-border/40">
          <div className="px-5 py-3 bg-muted/10 border-b border-border/20 flex items-center justify-between">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
              Raw Configuration
            </h4>
            <CopyButton
              value={advancedCustomization}
              variant="ghost"
              size="sm"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            />
          </div>
          <div className="p-0 bg-muted/5">
            <pre className="p-5 text-xs font-mono text-muted-foreground/80 overflow-x-auto max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent leading-relaxed">
              {advancedCustomization}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// Section header for the liveries list
interface LiveriesSectionProps {
  liveries: Array<{
    _id: string;
    title?: string;
    keyValues: KeyValue[];
    advancedCustomization?: string;
  }>;
}

export function LiveriesSection({ liveries }: LiveriesSectionProps) {
  const isPack = liveries.length > 1;

  // Format all liveries for "Copy All"
  const formatAllLiveries = () => {
    return liveries
      .map((livery, i) => {
        const header = livery.title || `Livery ${i + 1}`;
        const kvs = livery.keyValues
          .map((kv) => `${kv.key}: ${kv.value}`)
          .join("\n");
        const adv = livery.advancedCustomization
          ? `\nAdvanced:\n${livery.advancedCustomization}`
          : "";
        return `=== ${header} ===\n${kvs}${adv}`;
      })
      .join("\n\n");
  };

  return (
    <section className="space-y-6">
      {/* Restored Section Header with Badge */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 bg-primary rounded-full" />
          <h2 className="text-xl font-black text-foreground uppercase tracking-[0.05em]">
            Configuration Data
          </h2>
          {isPack && (
            <Badge
              variant="secondary"
              className="px-2 py-0.5 h-6 text-[10px] font-black uppercase tracking-[0.1em] bg-muted/50 border-border/40 text-muted-foreground"
            >
              {liveries.length} variations
            </Badge>
          )}
        </div>
        {isPack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(formatAllLiveries());
              toast.success("All configurations copied");
            }}
            className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider gap-2 text-muted-foreground hover:text-foreground"
          >
            <Copy size={12} />
            Copy All
          </Button>
        )}
      </div>

      {/* Livery Cards Stack */}
      <div className="space-y-6">
        {liveries.map((livery, index) => (
          <LiveryDataCard
            key={livery._id}
            title={livery.title}
            keyValues={livery.keyValues}
            advancedCustomization={livery.advancedCustomization}
            index={index}
            isOnlyVariation={liveries.length === 1}
          />
        ))}
      </div>
    </section>
  );
}
