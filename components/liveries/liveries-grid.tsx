"use client";

import { cn } from "@/lib/utils";
import { LiveryCardEnhanced } from "./livery-card-enhanced";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plane, Loader2 } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Livery type that works with both mock and real data
interface Livery {
  id: string;
  title: string;
  description: string;
  vehicles: string[];
  vehicleTypes: string[];
  vehicle?: string;
  vehicleType?: string;
  thumbnailUrl: string;
  username: string;
  createdAt: number;
  likeCount: number;
  favoriteCount: number;
  liveryCount?: number;
}

interface LiveriesGridProps {
  liveries: Livery[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

// Skeleton card for loading state
function LiveryCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-card/30 border border-border/50">
      <Skeleton className="aspect-[4/3] w-full" />
    </div>
  );
}

// Empty state
function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
        <Plane size={32} className="text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No liveries found</h3>
      <p className="text-muted-foreground max-w-sm">
        Try adjusting your filters or search terms to find what you&apos;re
        looking for.
      </p>
    </div>
  );
}

export function LiveriesGrid({
  liveries,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  onEdit,
  onDelete,
  className,
}: LiveriesGridProps) {
  // Track rendered IDs to know which cards are new
  const [renderedIds, setRenderedIds] = useState<Set<string>>(new Set());
  const isFirstRender = useRef(true);

  // Update rendered IDs after each render
  useEffect(() => {
    if (liveries.length > 0) {
      // Delay marking as rendered so animation plays first
      const timer = setTimeout(() => {
        setRenderedIds(new Set(liveries.map((l) => l.id)));
        isFirstRender.current = false;
      }, 600); // After animation completes
      return () => clearTimeout(timer);
    }
  }, [liveries]);

  // Check if a card should animate (is new)
  const shouldAnimate = (id: string) => {
    // On first render, animate all
    if (isFirstRender.current) return true;
    // Otherwise, only animate if not previously rendered
    return !renderedIds.has(id);
  };

  // Delayed skeleton state
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isLoading && liveries.length === 0) {
      timeout = setTimeout(() => {
        setShowSkeleton(true);
      }, 200); // 200ms delay to prevent flicker
    } else {
      setShowSkeleton(false);
    }
    return () => clearTimeout(timeout);
  }, [isLoading, liveries.length]);

  // Show skeletons while loading initial data
  if (showSkeleton && isLoading && liveries.length === 0) {
    return (
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6",
          className,
        )}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <LiveryCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (!isLoading && liveries.length === 0) {
    return <EmptyState />;
  }

  // Calculate new card index for staggered animation
  const getNewCardAnimationIndex = (id: string, index: number) => {
    if (!shouldAnimate(id)) return 0;
    // Count how many new cards come before this one
    return (
      liveries.slice(0, index + 1).filter((l) => shouldAnimate(l.id)).length - 1
    );
  };

  return (
    <div className={cn("space-y-8", className)}>
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {liveries.map((livery, index) => {
          const animate = shouldAnimate(livery.id);
          const animationIndex = getNewCardAnimationIndex(livery.id, index);

          return (
            <div
              key={livery.id}
              className={cn(
                animate &&
                  "animate-in fade-in-0 slide-in-from-bottom-4 duration-500",
              )}
              style={
                animate
                  ? {
                      animationDelay: `${animationIndex * 50}ms`,
                      animationFillMode: "backwards",
                    }
                  : undefined
              }
            >
              <Link href={`/liveries/${livery.id}`}>
                <LiveryCardEnhanced
                  id={livery.id}
                  title={livery.title}
                  description={livery.description || ""}
                  vehicles={
                    livery.vehicles || (livery.vehicle ? [livery.vehicle] : [])
                  }
                  vehicleTypes={
                    livery.vehicleTypes ||
                    (livery.vehicleType ? [livery.vehicleType] : [])
                  }
                  thumbnailUrl={livery.thumbnailUrl || ""}
                  username={livery.username || "User"}
                  createdAt={livery.createdAt}
                  likeCount={livery.likeCount}
                  favoriteCount={livery.favoriteCount}
                  liveryCount={livery.liveryCount}
                  onEdit={onEdit ? () => onEdit(livery.id) : undefined}
                  onDelete={onDelete ? () => onDelete(livery.id) : undefined}
                />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-8"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Liveries"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
