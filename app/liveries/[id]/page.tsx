"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Share2,
  Layers,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveryImageGallery } from "@/components/liveries/livery-image-gallery";
import { LiveriesSection } from "@/components/liveries/livery-data-card";
import { LiveryCardEnhanced } from "@/components/liveries/livery-card-enhanced";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Id } from "@/convex/_generated/dataModel";

// Loading skeleton
function LiveryDetailSkeleton() {
  return (
    <div className="min-h-screen pb-16 pt-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button Skeleton */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>

        {/* Hero Section Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10 items-stretch">
          {/* Gallery Skeleton */}
          <div className="md:col-span-3 space-y-4">
            <Skeleton className="aspect-[16/10] rounded-2xl w-full" />
            <div className="flex gap-4 overflow-hidden pt-4 -mx-2 px-2">
              <Skeleton className="h-14 w-24 shrink-0 rounded-xl" />
              <Skeleton className="h-14 w-24 shrink-0 rounded-xl" />
              <Skeleton className="h-14 w-24 shrink-0 rounded-xl" />
              <Skeleton className="h-14 w-24 shrink-0 rounded-xl opacity-50" />
            </div>
          </div>

          {/* Sidebar Info Panel Skeleton */}
          <div className="md:col-span-2 h-full rounded-2xl border border-border/40 bg-card/40 p-6 flex flex-col space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-2/3 rounded-lg" />
            </div>

            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-3 w-16 rounded opacity-60" />
              </div>
            </div>

            <div className="space-y-3">
              <Skeleton className="h-3 w-32 rounded mb-2" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-28 rounded-lg" />
                <Skeleton className="h-7 w-24 rounded-lg" />
              </div>
            </div>

            <div className="flex-1 min-h-[50px]" />

            <div className="flex items-center gap-2 pt-4 border-t border-border/20">
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>

            <Skeleton className="h-3 w-24 rounded mt-4" />
          </div>
        </div>

        {/* Bottom Content Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* About Section Skeleton */}
          <div className="md:col-span-3 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-20 rounded" />
              <div className="flex-1 h-px bg-border/20" />
            </div>
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>

          {/* Livery Data Section Skeleton */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-28 rounded" />
              <div className="flex-1 h-px bg-border/20" />
            </div>
            <Skeleton className="h-[400px] w-full rounded-2xl shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const { data: session } = authClient.useSession();

  // Basic validation for Convex ID format (base32 strings, typically 32 chars)
  // Skip query if ID is obviously invalid to avoid Convex errors
  const isValidId = postId && /^[a-zA-Z0-9_-]{5,}$/.test(postId);

  // Fetch post data with liveries
  const post = useQuery(
    api.posts.getPost,
    isValidId ? { postId: postId as Id<"posts"> } : "skip",
  );

  // Fetch related liveries (same vehicle type)
  const relatedResult = useQuery(
    api.posts.browseLiveries,
    post
      ? {
          vehicleTypes:
            post.vehicleTypes && post.vehicleTypes.length > 0
              ? post.vehicleTypes
              : post.vehicleType
                ? [post.vehicleType]
                : undefined,
          limit: 5,
        }
      : "skip",
  );

  // Mutations for like/favorite
  const toggleLike = useMutation(api.likes.toggleLike);
  const toggleFavorite = useMutation(api.favorites.toggleFavorite);

  // Local optimistic state for immediate feedback
  const [localIsLiked, setLocalIsLiked] = useState<boolean>(false);
  const [localLikeCount, setLocalLikeCount] = useState<number>(0);
  const [localIsFavorited, setLocalIsFavorited] = useState<boolean>(false);
  const [localFavoriteCount, setLocalFavoriteCount] = useState<number>(0);

  // Refs to track pending mutations to prevent sync-back flickering
  const pendingLikes = useRef(0);
  const pendingFavorites = useRef(0);

  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state with post data when it arrives, BUT only if no mutations are in flight
  useEffect(() => {
    if (post) {
      if (pendingLikes.current === 0) {
        setLocalIsLiked(post.isLiked ?? false);
        setLocalLikeCount(post.likeCount ?? 0);
      }
      if (pendingFavorites.current === 0) {
        setLocalIsFavorited(post.isFavorited ?? false);
        setLocalFavoriteCount(post.favoriteCount ?? 0);
      }
    }
  }, [post]);

  const relatedPosts =
    relatedResult?.posts?.filter((p) => p._id !== postId) ?? [];

  // Handle like toggle
  const handleLike = async () => {
    if (!post) return;

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
      await toggleLike({ postId: postId as Id<"posts"> });
    } catch (error) {
      // 3. Revert on Error
      // Only revert if this was the last pending request to avoid mess with rapid toggles
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
        toast.error("Failed to like", { description: message });
      }
    } finally {
      pendingLikes.current -= 1;
      if (pendingLikes.current === 0) {
        setIsLiking(false);
      }
    }
  };

  // Handle favorite toggle
  const handleFavorite = async () => {
    if (!post) return;

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
      await toggleFavorite({ postId: postId as Id<"posts"> });
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
        toast.error("Failed to save", { description: message });
      }
    } finally {
      pendingFavorites.current -= 1;
      if (pendingFavorites.current === 0) {
        setIsSaving(false);
      }
    }
  };

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title ?? "Livery",
          url: url,
        });
      } catch {
        // User cancelled - try clipboard as fallback
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  // Loading state (only show loading for valid IDs while data is fetching)
  if (isValidId && post === undefined) {
    return <LiveryDetailSkeleton />;
  }

  // Not found (includes invalid IDs)
  if (!isValidId || post === null) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Livery Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The livery you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/liveries">Back to Liveries</Link>
          </Button>
        </div>
      </div>
    );
  }

  // TypeScript guard: post is guaranteed non-null after above checks
  if (!post) return null;

  const isPack = post.liveries.length > 1;
  const isAuthor = session?.user?.id === post.authorId;
  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative min-h-screen pb-16 pt-20 overflow-hidden">
      {/* Background Ambience - Cool tones matched with Create/Edit pages */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div
          className="absolute top-0 left-0 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/2 right-0 w-[500px] h-[500px] translate-x-1/3 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Breadcrumb / Back Navigation */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="-ml-2 hover:bg-muted/80 transition-all duration-200"
          >
            <Link
              href="/liveries"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={16} />
              Back to Liveries
            </Link>
          </Button>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10 md:items-center">
          {/* Image Gallery */}
          <div className="md:col-span-3">
            <LiveryImageGallery imageUrls={post.imageUrls} title={post.title} />
          </div>

          {/* Sidebar Info Panel - Premium Glassmorphism */}
          <div className="md:col-span-2 h-full rounded-2xl border border-border/40 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-xl p-6 flex flex-col justify-between shadow-lg shadow-black/5 dark:shadow-black/20">
            {/* UPPER SECTION */}
            <div>
              {/* Badges */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {post.vehicleTypes?.map((type) => (
                    <Badge
                      key={type}
                      className="bg-primary/15 text-primary border-primary/25 font-medium shadow-sm"
                    >
                      {type}
                    </Badge>
                  )) ||
                    (post.vehicleType && (
                      <Badge className="bg-primary/15 text-primary border-primary/25 font-medium shadow-sm">
                        {post.vehicleType}
                      </Badge>
                    ))}
                </div>
                {isAuthor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 rounded-xl border-primary/30 hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all duration-300 shrink-0"
                    onClick={() => router.push(`/liveries/${postId}/edit`)}
                  >
                    <Pencil size={14} />
                  </Button>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-foreground mb-4 leading-tight tracking-tight mt-6">
                {post.title}
              </h1>

              {/* Author Row */}
              <div className="flex items-center gap-3 group cursor-pointer mb-6">
                <Avatar className="h-9 w-9 ring-2 ring-border/50 ring-offset-2 ring-offset-background transition-all group-hover:ring-primary/50">
                  <AvatarImage
                    src={post.author?.image || undefined}
                    alt={post.author?.displayName || ""}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-sm font-semibold">
                    {post.author?.displayName?.slice(0, 1).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {post.author?.displayName || "Unknown User"}
                  </span>
                  <span className="text-xs text-muted-foreground">Creator</span>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="space-y-3 mb-6">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  Compatible Aircraft
                </p>
                <ul className="flex flex-wrap gap-2">
                  {(post.vehicles || [post.vehicle]).map((v, i) => (
                    <li
                      key={i}
                      className="text-xs font-medium text-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50"
                    >
                      {v}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* BOTTOM SECTION */}
            <div className="pt-6 border-t border-border/20 mt-auto">
              {/* Interaction Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLike}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 flex-1 justify-center font-medium",
                    localIsLiked
                      ? "bg-rose-500/15 text-rose-500 shadow-sm shadow-rose-500/10"
                      : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Heart
                    size={18}
                    className={cn(
                      "transition-transform duration-200",
                      localIsLiked && "fill-rose-500 scale-110",
                    )}
                  />
                  <span className="text-sm">{localLikeCount}</span>
                </button>
                <button
                  onClick={handleFavorite}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 flex-1 justify-center font-medium",
                    localIsFavorited
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-sm shadow-amber-500/10"
                      : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Bookmark
                    size={18}
                    className={cn(
                      "transition-transform duration-200",
                      localIsFavorited && "fill-amber-500 scale-110",
                    )}
                  />
                  <span className="text-sm">{localFavoriteCount}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center p-2.5 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
                >
                  <Share2 size={18} />
                </button>
              </div>

              {/* Date */}
              <p className="pt-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                {formattedDate}
              </p>
            </div>
          </div>
        </div>

        {/* Content Grid - About (left, below image) + Livery Data (right, below sidebar) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* About Section - Left column (2/3 width) */}
          {post.description && (
            <div className="md:col-span-3 space-y-4">
              {/* Section Header */}
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  About
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
              </div>

              <div className="p-5 rounded-2xl border border-border/40 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-sm shadow-sm space-y-4">
                {/* Description Text */}
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {post.description}
                </p>
              </div>
            </div>
          )}

          {/* Livery Data Section - Right column (1/3 width) */}
          <div
            className={cn(
              "md:col-span-2",
              !post.description && "md:col-start-4",
            )}
          >
            <LiveriesSection liveries={post.liveries} />
          </div>
        </div>

        {/* Related Liveries */}
        {relatedPosts.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                More {post.vehicleType} Liveries
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {relatedPosts.slice(0, 4).map((relatedPost) => (
                <Link
                  key={relatedPost._id}
                  href={`/liveries/${relatedPost._id}`}
                >
                  <LiveryCardEnhanced
                    id={relatedPost._id}
                    title={relatedPost.title}
                    description={relatedPost.description || ""}
                    vehicles={
                      relatedPost.vehicles ||
                      (relatedPost.vehicle ? [relatedPost.vehicle] : [])
                    }
                    vehicleTypes={
                      relatedPost.vehicleTypes ||
                      (relatedPost.vehicleType ? [relatedPost.vehicleType] : [])
                    }
                    thumbnailUrl={relatedPost.thumbnailUrl || ""}
                    username={relatedPost.authorName || "User"}
                    createdAt={relatedPost.createdAt}
                    likeCount={relatedPost.likeCount}
                    favoriteCount={relatedPost.favoriteCount}
                    liveryCount={relatedPost.liveryCount}
                  />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
