"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Share2,
  Layers,
  Calendar,
  Plane,
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
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const relatedPosts =
    relatedResult?.posts?.filter((p) => p._id !== postId) ?? [];

  // Handle like toggle
  const handleLike = async () => {
    if (isLiking || !post) return;
    setIsLiking(true);
    try {
      await toggleLike({ postId: postId as Id<"posts"> });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to like";
      if (message.includes("logged in")) {
        toast.error("Sign in required", {
          description: "Please sign in to like liveries",
        });
      } else {
        toast.error("Failed to like", { description: message });
      }
    } finally {
      setIsLiking(false);
    }
  };

  // Handle favorite toggle
  const handleFavorite = async () => {
    if (isSaving || !post) return;
    setIsSaving(true);
    try {
      await toggleFavorite({ postId: postId as Id<"posts"> });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save";
      if (message.includes("logged in")) {
        toast.error("Sign in required", {
          description: "Please sign in to save liveries",
        });
      } else {
        toast.error("Failed to save", { description: message });
      }
    } finally {
      setIsSaving(false);
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
    <div className="min-h-screen pb-16 pt-20">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb / Back Navigation */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link
              href="/liveries"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={16} />
              Back to Liveries
            </Link>
          </Button>

          {isAuthor && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
              onClick={() => router.push(`/liveries/${postId}/edit`)}
            >
              <Pencil size={14} />
              Edit Livery
            </Button>
          )}
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <LiveryImageGallery imageUrls={post.imageUrls} title={post.title} />

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Vehicle Types Badges */}
            <div className="flex flex-wrap gap-2 mb-2">
              {post.vehicleTypes?.map((type) => (
                <Badge
                  key={type}
                  className="bg-primary/10 text-primary border-primary/20 backdrop-blur-sm"
                >
                  {type}
                </Badge>
              )) ||
                (post.vehicleType && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 backdrop-blur-sm">
                    {post.vehicleType}
                  </Badge>
                ))}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-4 drop-shadow-2xl">
              {post.title}
            </h1>
            <div className="flex flex-wrap gap-2">
              {isPack && (
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                  <Layers size={12} className="mr-1" />
                  {post.liveries.length} Liveries
                </Badge>
              )}
            </div>

            {/* Author */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={post.author?.image || undefined}
                  alt={post.author?.displayName || ""}
                />
                <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                  {post.author?.displayName?.slice(0, 1).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {post.author?.displayName || "Unknown User"}
                </p>
                <p className="text-sm text-muted-foreground">Creator</p>
              </div>
            </div>

            {/* Interactive Stats + Share */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* Interactive Stats - clicking toggles the action */}
              <div className="flex items-center gap-4">
                {/* Like Button */}
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors group",
                    post.isLiked
                      ? "bg-rose-500/10 hover:bg-rose-500/20"
                      : "hover:bg-muted/50",
                    isLiking && "opacity-50 cursor-not-allowed",
                  )}
                  title={
                    post.isLiked ? "Unlike this livery" : "Like this livery"
                  }
                >
                  <Heart
                    size={20}
                    className={cn(
                      "group-hover:scale-110 transition-transform",
                      post.isLiked
                        ? "text-rose-500 fill-rose-500"
                        : "text-rose-400",
                    )}
                  />
                  <span className="font-medium text-foreground">
                    {post.likeCount}
                  </span>
                  <span className="text-muted-foreground text-sm">likes</span>
                </button>

                {/* Save/Favorite Button */}
                <button
                  onClick={handleFavorite}
                  disabled={isSaving}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors group",
                    post.isFavorited
                      ? "bg-amber-500/10 hover:bg-amber-500/20"
                      : "hover:bg-muted/50",
                    isSaving && "opacity-50 cursor-not-allowed",
                  )}
                  title={
                    post.isFavorited ? "Remove from saves" : "Save to favorites"
                  }
                >
                  <Bookmark
                    size={20}
                    className={cn(
                      "group-hover:scale-110 transition-transform",
                      post.isFavorited
                        ? "text-amber-500 fill-amber-500"
                        : "text-amber-400",
                    )}
                  />
                  <span className="font-medium text-foreground">
                    {post.favoriteCount}
                  </span>
                  <span className="text-muted-foreground text-sm">saves</span>
                </button>
              </div>

              {/* Share Button */}
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleShare}
              >
                <Share2 size={16} />
                Share
              </Button>
            </div>

            {/* Description */}
            {post.description && (
              <p className="text-muted-foreground leading-relaxed">
                {post.description}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap gap-6 pt-4 border-t border-border/50 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Plane size={16} />
                <div className="flex flex-wrap gap-1">
                  {post.vehicles?.map((v, i) => (
                    <span key={v}>
                      {v}
                      {i < (post.vehicles?.length || 0) - 1 ? ", " : ""}
                    </span>
                  )) || <span>{post.vehicle}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar size={16} />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Liveries Section */}
        <div className="mb-12">
          <LiveriesSection liveries={post.liveries} />
        </div>

        {/* Related Liveries */}
        {relatedPosts.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">
              More {post.vehicleType} Liveries
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

// Loading skeleton
function LiveryDetailSkeleton() {
  return (
    <div className="min-h-screen pb-16 pt-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button Skeleton */}
        <Skeleton className="h-8 w-36 mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Skeleton */}
          <Skeleton className="aspect-[16/10] rounded-xl" />

          {/* Info Skeleton */}
          <div className="space-y-6">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-10 w-3/4" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-8 w-20" />
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        </div>

        {/* Liveries Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
