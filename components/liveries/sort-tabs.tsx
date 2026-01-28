"use client";

import { cn } from "@/lib/utils";
import { SORT_OPTIONS, type SortOption } from "@/lib/mock-liveries";
import { TrendingUp, Clock, Heart } from "lucide-react";

interface SortTabsProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  className?: string;
}

const SORT_ICONS: Record<SortOption, React.ReactNode> = {
  popular: <TrendingUp size={14} />,
  latest: <Clock size={14} />,
  "most-liked": <Heart size={14} />,
};

export function SortTabs({ value, onChange, className }: SortTabsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {SORT_OPTIONS.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium",
              "border transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
            )}
          >
            {SORT_ICONS[option.value]}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
