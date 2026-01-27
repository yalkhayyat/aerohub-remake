"use client";

import * as React from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { LiveryInput, LiveryKeyValue } from "@/types/post";

interface LiveryEditorProps {
  liveries: LiveryInput[];
  onLiveriesChange: (liveries: LiveryInput[]) => void;
  disabled?: boolean;
}

export function LiveryEditor({
  liveries,
  onLiveriesChange,
  disabled = false,
}: LiveryEditorProps) {
  const [openStates, setOpenStates] = React.useState<boolean[]>([true]);

  // Add a new livery
  const addLivery = () => {
    onLiveriesChange([
      ...liveries,
      {
        title: `Livery ${liveries.length + 1}`,
        keyValues: [{ key: "", value: "" }],
        advancedCustomization: undefined,
      },
    ]);
    setOpenStates([...openStates, true]);
  };

  // Remove a livery
  const removeLivery = (index: number) => {
    if (liveries.length <= 1) return; // Must have at least one livery
    const newLiveries = [...liveries];
    newLiveries.splice(index, 1);
    onLiveriesChange(newLiveries);

    const newOpenStates = [...openStates];
    newOpenStates.splice(index, 1);
    setOpenStates(newOpenStates);
  };

  // Toggle livery open state
  const toggleLivery = (index: number) => {
    const newOpenStates = [...openStates];
    newOpenStates[index] = !newOpenStates[index];
    setOpenStates(newOpenStates);
  };

  // Add a key-value pair to a livery
  const addKeyValue = (liveryIndex: number) => {
    const newLiveries = [...liveries];
    newLiveries[liveryIndex].keyValues.push({ key: "", value: "" });
    onLiveriesChange(newLiveries);
  };

  // Remove a key-value pair from a livery
  const removeKeyValue = (liveryIndex: number, kvIndex: number) => {
    const newLiveries = [...liveries];
    if (newLiveries[liveryIndex].keyValues.length <= 1) return; // Must have at least one
    newLiveries[liveryIndex].keyValues.splice(kvIndex, 1);
    onLiveriesChange(newLiveries);
  };

  // Update a key-value pair
  const updateKeyValue = (
    liveryIndex: number,
    kvIndex: number,
    field: "key" | "value",
    value: string,
  ) => {
    const newLiveries = [...liveries];
    if (field === "key") {
      newLiveries[liveryIndex].keyValues[kvIndex].key = value;
    } else {
      newLiveries[liveryIndex].keyValues[kvIndex].value = value;
    }
    onLiveriesChange(newLiveries);
  };

  // Update advanced customization
  const updateAdvanced = (liveryIndex: number, value: string) => {
    const newLiveries = [...liveries];
    newLiveries[liveryIndex].advancedCustomization = value.trim() || undefined;
    onLiveriesChange(newLiveries);
  };

  // Update livery title
  const updateLiveryTitle = (liveryIndex: number, title: string) => {
    const newLiveries = [...liveries];
    newLiveries[liveryIndex].title = title;
    onLiveriesChange(newLiveries);
  };

  const isLiveryPack = liveries.length > 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {isLiveryPack ? "Livery Pack" : "Livery"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isLiveryPack
              ? `${liveries.length} liveries in this pack`
              : "Add multiple liveries to create a pack"}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLivery}
          disabled={disabled}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add Livery
        </Button>
      </div>

      {/* Livery list */}
      <div className="space-y-3">
        {liveries.map((livery, liveryIndex) => (
          <Collapsible
            key={liveryIndex}
            open={openStates[liveryIndex] ?? true}
            onOpenChange={() => toggleLivery(liveryIndex)}
          >
            <div className="rounded-lg border bg-card">
              {/* Livery header */}
              <CollapsibleTrigger asChild>
                <div className="flex cursor-pointer items-center justify-between p-3 hover:bg-muted/50">
                  <div className="flex items-center gap-2 flex-1">
                    {openStates[liveryIndex] ? (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    )}
                    <div
                      className="flex-1 mr-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Input
                        value={livery.title ?? `Livery ${liveryIndex + 1}`}
                        onChange={(e) =>
                          updateLiveryTitle(liveryIndex, e.target.value)
                        }
                        className="h-8 bg-transparent border-transparent hover:border-input focus:bg-background focus:border-input px-2 font-medium"
                        placeholder={`Livery ${liveryIndex + 1}`}
                        disabled={disabled}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      ({livery.keyValues.length} part
                      {livery.keyValues.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                  {liveries.length > 1 && !disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive shrink-0 ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLivery(liveryIndex);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="space-y-4 border-t p-4">
                  {/* Key-Value pairs */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Parts & IDs</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addKeyValue(liveryIndex)}
                        disabled={disabled}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Part
                      </Button>
                    </div>

                    {livery.keyValues.map((kv, kvIndex) => (
                      <div key={kvIndex} className="flex items-center gap-2">
                        <Input
                          placeholder="Part name (e.g. Body)"
                          value={kv.key}
                          onChange={(e) =>
                            updateKeyValue(
                              liveryIndex,
                              kvIndex,
                              "key",
                              e.target.value,
                            )
                          }
                          disabled={disabled}
                          className="flex-1 bg-slate-900 border-slate-800"
                        />
                        <Input
                          placeholder="ID (e.g. 13091855406)"
                          value={kv.value}
                          onChange={(e) =>
                            updateKeyValue(
                              liveryIndex,
                              kvIndex,
                              "value",
                              e.target.value,
                            )
                          }
                          disabled={disabled}
                          className="w-48 bg-slate-900 border-slate-800"
                        />
                        {livery.keyValues.length > 1 && !disabled && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => removeKeyValue(liveryIndex, kvIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Advanced customization */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-muted-foreground"
                      >
                        <Code className="mr-2 h-4 w-4" />
                        Advanced Customization (JSON)
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <Textarea
                        placeholder='{"customField": "value"}'
                        value={livery.advancedCustomization ?? ""}
                        onChange={(e) =>
                          updateAdvanced(liveryIndex, e.target.value)
                        }
                        disabled={disabled}
                        className="font-mono text-sm"
                        rows={4}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Optional JSON for additional customization data
                      </p>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>

      {/* Validation message */}
      {liveries.length === 0 && (
        <p className="text-sm text-destructive">
          At least 1 livery is required
        </p>
      )}
      {liveries.some((l) => l.keyValues.some((kv) => !kv.key.trim())) && (
        <p className="text-sm text-amber-500">Some parts are missing names</p>
      )}
    </div>
  );
}
