"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";

interface LiveriesSearchProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function LiveriesSearch({
  value,
  onChange,
  className,
}: LiveriesSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={cn("relative w-full max-w-xl mx-auto", className)}>
      {/* Input */}
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search liveries..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "h-12 pl-12 pr-10 text-base",
          "bg-card/50 border-border/50 backdrop-blur-sm",
          "focus:bg-card focus:border-primary/50",
          "placeholder:text-muted-foreground/60",
          "transition-all duration-200",
        )}
      />

      {/* Search Icon */}
      <Search
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors pointer-events-none",
          isFocused ? "text-primary" : "text-muted-foreground",
        )}
      />

      {/* Right side: Clear button */}
      {value && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            onClick={() => onChange("")}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}
