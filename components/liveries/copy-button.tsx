"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
  variant?: "default" | "ghost" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  onCopy?: () => void;
}

export function CopyButton({
  value,
  label,
  className,
  variant = "ghost",
  size = "icon",
  onCopy,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopy?.();

      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [value, onCopy]);

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "transition-all duration-200",
        copied && "text-green-500",
        className,
      )}
      onClick={handleCopy}
      title={copied ? "Copied!" : `Copy ${label || "to clipboard"}`}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {label && size !== "icon" && (
        <span className="ml-2">{copied ? "Copied!" : label}</span>
      )}
    </Button>
  );
}

// Larger copy button with text
export function CopyButtonWithLabel({
  value,
  label,
  className,
  onCopy,
}: Omit<CopyButtonProps, "size" | "variant">) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [value, onCopy]);

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "transition-all duration-200 gap-2",
        copied && "border-green-500 text-green-500",
        className,
      )}
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {label || "Copy"}
        </>
      )}
    </Button>
  );
}
