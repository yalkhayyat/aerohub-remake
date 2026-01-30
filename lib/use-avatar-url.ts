"use client";

import { useConvex } from "convex/react";
import { useState, useEffect } from "react";
import { api } from "@/convex/_generated/api";

// Prefix for R2 storage keys stored in user.image
const R2_PREFIX = "r2:";

/**
 * Check if an image string is an R2 key (vs external URL like Discord avatar)
 */
export function isR2Key(image: string | null | undefined): boolean {
  return image?.startsWith(R2_PREFIX) ?? false;
}

/**
 * Extract the R2 storage key from a prefixed string
 */
export function getR2Key(image: string): string {
  return image.slice(R2_PREFIX.length);
}

/**
 * Create an R2-prefixed string from a storage key
 */
export function toR2ImageString(storageKey: string): string {
  return `${R2_PREFIX}${storageKey}`;
}

/**
 * Hook to resolve an avatar image URL.
 * If the image is an R2 key (prefixed with "r2:"), fetches a signed URL.
 * Otherwise returns the image as-is (external URLs like Discord avatars).
 */
export function useAvatarUrl(
  image: string | null | undefined,
): string | undefined {
  const convex = useConvex();
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(
    // If not an R2 key, use directly
    image && !isR2Key(image) ? image : undefined,
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // No image provided
    if (!image) {
      setResolvedUrl(undefined);
      return;
    }

    // External URL (e.g., Discord avatar) - use directly
    if (!isR2Key(image)) {
      setResolvedUrl(image);
      return;
    }

    // R2 key - fetch signed URL
    const storageKey = getR2Key(image);
    setIsLoading(true);

    convex
      .action(api.r2.getUrl, { storageId: storageKey })
      .then((url) => {
        setResolvedUrl(url ?? undefined);
      })
      .catch((error) => {
        console.error("Failed to resolve avatar URL:", error);
        setResolvedUrl(undefined);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [image, convex]);

  return resolvedUrl;
}
