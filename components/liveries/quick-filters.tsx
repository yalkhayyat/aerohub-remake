"use client";

import { cn } from "@/lib/utils";

interface QuickFiltersProps {
  vehicleTypes: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

// Popular categories to show as quick filters
const QUICK_FILTER_TYPES = [
  "Jet",
  "Helicopter",
  "Multi-Engine",
  "Single-Engine",
  "VTOL",
  "Supersonic",
];

export function QuickFilters({
  vehicleTypes,
  selected,
  onChange,
  className,
}: QuickFiltersProps) {
  const availableFilters = QUICK_FILTER_TYPES.filter((type) =>
    vehicleTypes.includes(type),
  );

  const toggleFilter = (type: string) => {
    if (selected.includes(type)) {
      onChange(selected.filter((t) => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  const clearAll = () => onChange([]);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* All button */}
      <button
        onClick={clearAll}
        className={cn(
          "px-4 py-1.5 rounded-full text-sm font-medium",
          "border transition-all duration-200",
          selected.length === 0
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
        )}
      >
        All
      </button>

      {/* Category chips */}
      {availableFilters.map((type) => {
        const isActive = selected.includes(type);
        return (
          <button
            key={type}
            onClick={() => toggleFilter(type)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium",
              "border transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
            )}
          >
            {type}
          </button>
        );
      })}
    </div>
  );
}
