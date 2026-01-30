"use client";

import * as React from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Code,
  Copy,
} from "lucide-react";
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

const MAX_LIVERY_TITLE_LENGTH = 50;

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
        title: "",
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

  // Duplicate a livery
  const duplicateLivery = (index: number) => {
    const liveryToCopy = liveries[index];
    const newLivery = {
      ...liveryToCopy,
      title: liveryToCopy.title ? `${liveryToCopy.title} (Copy)` : "",
      // Deep copy keyValues
      keyValues: liveryToCopy.keyValues.map((kv) => ({ ...kv })),
    };

    const newLiveries = [...liveries];
    newLiveries.splice(index + 1, 0, newLivery);
    onLiveriesChange(newLiveries);

    const newOpenStates = [...openStates];
    newOpenStates.splice(index + 1, 0, true);
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
      <div className="space-y-4">
        {liveries.map((livery, liveryIndex) => (
          <Collapsible
            key={liveryIndex}
            open={openStates[liveryIndex] ?? true}
            onOpenChange={() => toggleLivery(liveryIndex)}
          >
            <div className="rounded-lg border border-border/50 bg-muted/10">
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
                      <div className="relative group/title">
                        <Input
                          value={livery.title ?? ""}
                          onChange={(e) =>
                            updateLiveryTitle(liveryIndex, e.target.value)
                          }
                          className={cn(
                            "h-9 bg-muted/20 border-border/50 hover:border-primary/30 focus:border-primary/50 px-3 font-medium transition-all pr-12",
                            (livery.title?.length ?? 0) >
                              MAX_LIVERY_TITLE_LENGTH &&
                              "text-destructive border-destructive focus:border-destructive",
                          )}
                          placeholder={`Livery Name`}
                          disabled={disabled}
                        />
                        <span
                          className={cn(
                            "absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground opacity-0 group-hover/title:opacity-100 transition-opacity pointer-events-none",
                            (livery.title?.length ?? 0) >
                              MAX_LIVERY_TITLE_LENGTH &&
                              "opacity-100 text-destructive font-bold",
                          )}
                        >
                          {livery.title?.length ?? 0}/{MAX_LIVERY_TITLE_LENGTH}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      ({livery.keyValues.length} part
                      {livery.keyValues.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {!disabled && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
                        title="Duplicate livery"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateLivery(liveryIndex);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                    {liveries.length > 1 && !disabled && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                        title="Remove livery"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLivery(liveryIndex);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
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

                    {livery.keyValues.map((kv, kvIndex) => {
                      const isKeyError = kv.key.length > 20;
                      const isValueError =
                        kv.value.length > 20 ||
                        (kv.value !== "" && !/^\d+$/.test(kv.value));

                      return (
                        <div key={kvIndex} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 space-y-1">
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
                                className={cn(
                                  "bg-muted/50 border-border/20 focus:bg-background focus:border-primary/50",
                                  isKeyError &&
                                    "border-destructive focus:border-destructive",
                                )}
                              />
                            </div>
                            <div className="w-48 space-y-1">
                              <Input
                                placeholder="ID (e.g. 13091855406)"
                                value={kv.value}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  // Only allow numbers if not empty
                                  if (val === "" || /^\d+$/.test(val)) {
                                    updateKeyValue(
                                      liveryIndex,
                                      kvIndex,
                                      "value",
                                      val,
                                    );
                                  }
                                }}
                                disabled={disabled}
                                className={cn(
                                  "bg-muted/50 border-border/20 focus:bg-background focus:border-primary/50",
                                  isValueError &&
                                    "border-destructive focus:border-destructive",
                                )}
                              />
                            </div>
                            {livery.keyValues.length > 1 && !disabled && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() =>
                                  removeKeyValue(liveryIndex, kvIndex)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {(isKeyError || isValueError) && (
                            <div className="flex gap-2 px-1">
                              {isKeyError && (
                                <p className="text-[10px] text-destructive flex-1">
                                  Name max 20 characters
                                </p>
                              )}
                              {isValueError && (
                                <p className="text-[10px] text-destructive w-48">
                                  IDs must be numbers (max 20)
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
                      <div className="space-y-1">
                        <Textarea
                          placeholder='{"customField": "value"}'
                          value={livery.advancedCustomization ?? ""}
                          onChange={(e) =>
                            updateAdvanced(liveryIndex, e.target.value)
                          }
                          disabled={disabled}
                          className={cn(
                            "font-mono text-sm",
                            (livery.advancedCustomization?.length ?? 0) > 500 &&
                              "border-destructive focus:border-destructive",
                          )}
                          rows={4}
                        />
                        {(livery.advancedCustomization?.length ?? 0) > 500 && (
                          <p className="text-[10px] text-destructive">
                            Advanced customization must be 500 characters or
                            less (currently{" "}
                            {livery.advancedCustomization?.length})
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground flex justify-between">
                          <span>
                            Optional JSON for additional customization data
                          </span>
                          <span
                            className={cn(
                              (livery.advancedCustomization?.length ?? 0) >
                                500 && "text-destructive font-bold",
                            )}
                          >
                            {livery.advancedCustomization?.length ?? 0}/500
                          </span>
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>

      {/* Validation message */}
      <div className="space-y-1">
        {liveries.length === 0 && (
          <p className="text-sm text-destructive font-medium">
            At least 1 livery is required
          </p>
        )}
        {liveries.some((l) =>
          l.keyValues.some(
            (kv) =>
              !kv.key.trim() ||
              kv.key.length > 20 ||
              kv.value.length > 20 ||
              (kv.value !== "" && !/^\d+$/.test(kv.value)),
          ),
        ) && (
          <p className="text-sm text-destructive font-medium">
            Please fix errors in your livery parts (names/IDs)
          </p>
        )}
        {liveries.some((l) => (l.advancedCustomization?.length ?? 0) > 500) && (
          <p className="text-sm text-destructive font-medium">
            Advanced customization is too long
          </p>
        )}
        {liveries.some(
          (l) => (l.title?.length ?? 0) > MAX_LIVERY_TITLE_LENGTH,
        ) && (
          <p className="text-sm text-destructive font-medium">
            One or more livery titles are too long (max{" "}
            {MAX_LIVERY_TITLE_LENGTH} characters)
          </p>
        )}
      </div>
    </div>
  );
}
