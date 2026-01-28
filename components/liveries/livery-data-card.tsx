"use client";

import { useState } from "react";
import { CopyButton, CopyButtonWithLabel } from "./copy-button";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Format all key-values for "Copy All"
  const formatAllKeyValues = () => {
    return keyValues.map((kv) => `${kv.key}: ${kv.value}`).join("\n");
  };

  // Parse and format advanced customization for display
  const formatAdvancedCustomization = () => {
    if (!advancedCustomization) return null;
    try {
      const parsed = JSON.parse(advancedCustomization);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return advancedCustomization;
    }
  };

  const formattedAdvanced = formatAdvancedCustomization();

  return (
    <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          {!isOnlyVariation && (
            <Badge variant="outline" className="text-xs font-mono">
              #{index + 1}
            </Badge>
          )}
          <h3 className="font-semibold text-foreground">
            {title || `Livery ${index + 1}`}
          </h3>
        </div>
        <CopyButtonWithLabel value={formatAllKeyValues()} label="Copy All" />
      </div>

      {/* Key-Value pairs */}
      <div className="p-4 space-y-2">
        {keyValues.map((kv, kvIndex) => (
          <div
            key={kvIndex}
            className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-sm font-medium text-muted-foreground w-16 shrink-0">
                {kv.key}
              </span>
              <code className="text-sm font-mono text-foreground truncate">
                {kv.value}
              </code>
            </div>
            <CopyButton
              value={kv.value}
              label={kv.key}
              className="opacity-50 group-hover:opacity-100 transition-opacity"
            />
          </div>
        ))}
      </div>

      {/* Advanced Customization (collapsible) */}
      {formattedAdvanced && (
        <div className="border-t border-border/30">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
          >
            <span className="text-sm font-medium text-muted-foreground">
              Advanced Customization
            </span>
            {showAdvanced ? (
              <ChevronUp size={16} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={16} className="text-muted-foreground" />
            )}
          </button>

          {showAdvanced && (
            <div className="px-4 pb-4">
              <div className="relative">
                <pre className="p-4 rounded-lg bg-muted/50 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                  {formattedAdvanced}
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton
                    value={advancedCustomization!}
                    label="JSON"
                    variant="secondary"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          )}
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
  onCopyAll?: () => void;
}

export function LiveriesSection({ liveries, onCopyAll }: LiveriesSectionProps) {
  const isPack = liveries.length > 1;

  // Format all liveries for "Copy All"
  const formatAllLiveries = () => {
    return liveries
      .map((livery, i) => {
        const header = livery.title || `Livery ${i + 1}`;
        const kvs = livery.keyValues
          .map((kv) => `${kv.key}: ${kv.value}`)
          .join("\n");
        return `=== ${header} ===\n${kvs}`;
      })
      .join("\n\n");
  };

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">
            {isPack ? "Liveries" : "Livery Data"}
          </h2>
          {isPack && (
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <Layers size={12} className="mr-1" />
              {liveries.length} in pack
            </Badge>
          )}
        </div>
        {isPack && (
          <CopyButtonWithLabel
            value={formatAllLiveries()}
            label="Copy All IDs"
            onCopy={onCopyAll}
          />
        )}
      </div>

      {/* Livery Cards */}
      <div className="space-y-4">
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
