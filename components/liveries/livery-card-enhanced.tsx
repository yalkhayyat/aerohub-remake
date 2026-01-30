"use client";

import { Badge } from "@/components/ui/badge";
import { Heart, Bookmark, Layers, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface LiveryCardEnhancedProps {
  id: string;
  title: string;
  description?: string;
  vehicles: string[];
  vehicleTypes: string[];
  thumbnailUrl: string;
  username: string;
  createdAt: number;
  likeCount: number;
  favoriteCount: number;
  liveryCount?: number; // Number of liveries in pack
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function LiveryCardEnhanced({
  id,
  title,
  description,
  vehicles = [],
  vehicleTypes = [],
  thumbnailUrl,
  username,
  createdAt,
  likeCount: initialLikeCount,
  favoriteCount: initialFavoriteCount,
  liveryCount = 1,
  onClick,
  onEdit,
  onDelete,
}: LiveryCardEnhancedProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isPack = liveryCount > 1;

  // Mutations
  const toggleLike = useMutation(api.likes.toggleLike);
  const toggleFavorite = useMutation(api.favorites.toggleFavorite);

  // Queries for state
  const isLikedQuery = useQuery(api.likes.isLiked, {
    postId: id as Id<"posts">,
  });
  const isFavoritedQuery = useQuery(api.favorites.isFavorited, {
    postId: id as Id<"posts">,
  });

  // Local Optimistic State
  // We initialize with the passed props/queries (defaulting to false/0 if undefined)
  const [localIsLiked, setLocalIsLiked] = useState<boolean>(false);
  const [localLikeCount, setLocalLikeCount] =
    useState<number>(initialLikeCount);

  const [localIsFavorited, setLocalIsFavorited] = useState<boolean>(false);
  const [localFavoriteCount, setLocalFavoriteCount] =
    useState<number>(initialFavoriteCount);

  // Refs to track pending mutations to prevent sync-back flickering
  const pendingLikes = useRef(0);
  const pendingFavorites = useRef(0);

  // Loading states (for mutation in flight)
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state with Server Data when it arrives/changes
  // This ensures that if another user likes the post, or on initial load, we eventually match the truth.
  useEffect(() => {
    if (isLikedQuery !== undefined && pendingLikes.current === 0) {
      setLocalIsLiked(isLikedQuery);
    }
  }, [isLikedQuery]);

  useEffect(() => {
    if (pendingLikes.current === 0) {
      setLocalLikeCount(initialLikeCount);
    }
  }, [initialLikeCount]);

  useEffect(() => {
    if (isFavoritedQuery !== undefined && pendingFavorites.current === 0) {
      setLocalIsFavorited(isFavoritedQuery);
    }
  }, [isFavoritedQuery]);

  useEffect(() => {
    if (pendingFavorites.current === 0) {
      setLocalFavoriteCount(initialFavoriteCount);
    }
  }, [initialFavoriteCount]);

  // Handlers
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Optimistic Update
    const previousIsLiked = localIsLiked;
    const previousCount = localLikeCount;
    const newIsLiked = !previousIsLiked;

    setLocalIsLiked(newIsLiked);
    setLocalLikeCount((prev) =>
      newIsLiked ? prev + 1 : Math.max(0, prev - 1),
    );

    pendingLikes.current += 1;
    setIsLiking(true);

    try {
      // 2. Perform Mutation
      await toggleLike({ postId: id as Id<"posts"> });
      // Success! Server state will eventually propagate via useQuery and props, matching our local state.
    } catch (error) {
      // 3. Revert on Error
      if (pendingLikes.current === 1) {
        setLocalIsLiked(previousIsLiked);
        setLocalLikeCount(previousCount);
      }

      const message = error instanceof Error ? error.message : "Failed to like";
      if (message.includes("logged in")) {
        toast.error("Sign in required", {
          description: "Please sign in to like liveries",
        });
      } else {
        toast.error("Error", { description: message });
      }
    } finally {
      pendingLikes.current -= 1;
      if (pendingLikes.current === 0) {
        setIsLiking(false);
      }
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Optimistic Update
    const previousIsFavorited = localIsFavorited;
    const previousCount = localFavoriteCount;
    const newIsFavorited = !previousIsFavorited;

    setLocalIsFavorited(newIsFavorited);
    setLocalFavoriteCount((prev) =>
      newIsFavorited ? prev + 1 : Math.max(0, prev - 1),
    );

    pendingFavorites.current += 1;
    setIsSaving(true);

    try {
      // 2. Perform Mutation
      await toggleFavorite({ postId: id as Id<"posts"> });
    } catch (error) {
      // 3. Revert on Error
      if (pendingFavorites.current === 1) {
        setLocalIsFavorited(previousIsFavorited);
        setLocalFavoriteCount(previousCount);
      }

      const message = error instanceof Error ? error.message : "Failed to save";
      if (message.includes("logged in")) {
        toast.error("Sign in required", {
          description: "Please sign in to save liveries",
        });
      } else {
        toast.error("Error", { description: message });
      }
    } finally {
      pendingFavorites.current -= 1;
      if (pendingFavorites.current === 0) {
        setIsSaving(false);
      }
    }
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl cursor-pointer overflow-hidden",
        "aspect-[4/3]",
        "shadow-lg shadow-black/20",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Background Image with zoom effect */}
      {thumbnailUrl && !imageError ? (
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          className={cn(
            "object-cover transition-transform duration-500 ease-out",
            isHovered && "scale-110",
          )}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">No Image</span>
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

      {/* Top Left: Vehicle Type Badge + Pack Badge */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10 max-w-[80%]">
        <Badge className="bg-black/70 text-white border-0 backdrop-blur-sm">
          {vehicleTypes[0] || "Aircraft"}
        </Badge>
        {isPack && (
          <Badge className="bg-primary/90 text-primary-foreground border-0 backdrop-blur-sm flex items-center gap-1">
            <Layers size={12} />
            {liveryCount}
          </Badge>
        )}
      </div>

      {/* Quick Actions - top right */}
      <div
        className={cn(
          "absolute top-3 right-3 flex gap-2 z-10",
          "transition-all duration-300",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
        )}
      >
        {onDelete && (
          <button
            className="p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-destructive/20 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            title="Delete Post"
          >
            <Trash2 size={16} className="text-destructive" />
          </button>
        )}
        {onEdit && (
          <button
            className="p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-white/20 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
            }}
            title="Edit Post"
          >
            <Pencil size={16} className="text-white" />
          </button>
        )}

        <button
          className={cn(
            "p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-white/20 transition-colors",
            localIsLiked && "bg-rose-500/20",
          )}
          onClick={handleLike}
          title={localIsLiked ? "Unlike" : "Like"}
        >
          <Heart
            size={16}
            className={cn(
              "transition-all",
              localIsLiked ? "text-rose-500 fill-rose-500" : "text-white",
              // Remove opacity reduction on isLiking to maintain "solid" feel during optimistic update
              // but keep button disabled to prevent race conditions
            )}
          />
        </button>
        <button
          className={cn(
            "p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-white/20 transition-colors",
            localIsFavorited && "bg-amber-500/20",
          )}
          onClick={handleFavorite}
          title={localIsFavorited ? "Remove from saves" : "Save to favorites"}
        >
          <Bookmark
            size={16}
            className={cn(
              "transition-all",
              localIsFavorited ? "text-amber-500 fill-amber-500" : "text-white",
            )}
          />
        </button>
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <h3 className="font-semibold text-white text-lg leading-tight line-clamp-1 mb-1">
          {title}
        </h3>
        <div className="flex items-center gap-2 text-white/70 text-sm mb-3">
          <span className="truncate max-w-[150px]">{vehicles[0]}</span>
          {vehicles.length > 1 && (
            <Badge
              variant="secondary"
              className="h-5 px-1.5 text-[10px] bg-white/20 text-white hover:bg-white/30 border-0"
            >
              +{vehicles.length - 1}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3 text-white/80">
            <span className="flex items-center gap-1">
              <Heart
                size={14}
                className={cn(
                  localIsLiked
                    ? "text-rose-500 fill-rose-500"
                    : "text-rose-400",
                )}
              />
              {localLikeCount}
            </span>
            <span className="flex items-center gap-1">
              <Bookmark
                size={14}
                className={cn(
                  localIsFavorited
                    ? "text-amber-500 fill-amber-500"
                    : "text-amber-400",
                )}
              />
              {localFavoriteCount}
            </span>
          </div>
          <div className="text-white/60 text-xs">
            by <span className="text-white/90 font-medium">{username}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
