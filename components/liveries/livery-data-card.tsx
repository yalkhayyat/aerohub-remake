"use client";

import { useState } from "react";
import { Check, Copy, Layers } from "lucide-react";
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
  const [copied, setCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Format all data for copy
  const formatAllData = () => {
    const kvs = keyValues.map((kv) => `${kv.key}: ${kv.value}`).join("\n");
    if (advancedCustomization) {
      return `${kvs}\n\nAdvanced Customization:\n${advancedCustomization}`;
    }
    return kvs;
  };

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(formatAllData());
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

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
        {/* Copy all button */}
        <button
          onClick={handleCopyAll}
          className={cn(
            "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
            copied
              ? "bg-green-500/15 text-green-600 dark:text-green-400 shadow-sm"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy All"}
        </button>
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

// Section for all liveries
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

  return (
    <section>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          Livery Data
        </h2>
        {isPack && (
          <Badge variant="secondary" className="font-medium shadow-sm">
            <Layers size={14} className="mr-1" />
            {liveries.length} PACK
          </Badge>
        )}
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
      </div>

      {/* Livery Cards - Compact grid with independent heights */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-start">
        {liveries.map((livery, index) => (
          <LiveryDataCard
            key={livery._id}
            title={isPack ? livery.title : undefined}
            keyValues={livery.keyValues}
            advancedCustomization={livery.advancedCustomization}
            index={index}
            isOnlyVariation={!isPack}
          />
        ))}
      </div>
    </section>
  );
}
