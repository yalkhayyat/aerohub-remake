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

          {isAuthor && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-full border-primary/30 hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md"
              onClick={() => router.push(`/liveries/${postId}/edit`)}
            >
              <Pencil size={14} />
              Edit Livery
            </Button>
          )}
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 items-stretch">
          {/* Image Gallery */}
          <div className="md:col-span-2 h-full">
            <LiveryImageGallery
              imageUrls={post.imageUrls}
              title={post.title}
              className="h-full"
            />
          </div>

          {/* Sidebar Info Panel - Premium Glassmorphism */}
          <div className="md:col-span-1 h-full rounded-2xl border border-border/40 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-xl p-6 flex flex-col shadow-lg shadow-black/5 dark:shadow-black/20">
            {/* TOP SECTION */}
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
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
              {/* {isPack && (
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25 font-medium shadow-sm">
                  <Layers size={12} className="mr-1.5" />
                  {post.liveries.length} Liveries
                </Badge>
              )} */}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-foreground mb-4 leading-tight tracking-tight">
              {post.title}
            </h1>

            {/* Author Row */}
            <div className="flex items-center gap-3 group cursor-pointer">
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

            {/* SPACER */}
            <div className="flex-1 min-h-8" />

            {/* BOTTOM SECTION */}
            <div className="pt-5 border-t border-border/40 space-y-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Published {formattedDate}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 flex-1 justify-center font-medium",
                    post.isLiked
                      ? "bg-rose-500/15 text-rose-500 shadow-sm shadow-rose-500/10"
                      : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground",
                    isLiking && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <Heart
                    size={18}
                    className={cn(
                      "transition-transform duration-200",
                      post.isLiked && "fill-rose-500 scale-110",
                    )}
                  />
                  <span className="text-sm">{post.likeCount}</span>
                </button>
                <button
                  onClick={handleFavorite}
                  disabled={isSaving}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 flex-1 justify-center font-medium",
                    post.isFavorited
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-sm shadow-amber-500/10"
                      : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground",
                    isSaving && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <Bookmark
                    size={18}
                    className={cn(
                      "transition-transform duration-200",
                      post.isFavorited && "fill-amber-500 scale-110",
                    )}
                  />
                  <span className="text-sm">{post.favoriteCount}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center p-2.5 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* About Section - Description + Vehicle */}
        {(post.description || post.vehicles || post.vehicle) && (
          <div className="mb-10 space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                About
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
            </div>
            <div className="p-5 rounded-2xl border border-border/40 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-sm shadow-sm space-y-4">
              {/* Description Text */}
              {post.description && (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {post.description}
                </p>
              )}

              {/* Vehicle Info */}
              <div className="pt-3 border-t border-border/30">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Compatible Aircraft
                </p>
                <ul className="space-y-1">
                  {(post.vehicles || [post.vehicle]).map((v, i) => (
                    <li
                      key={i}
                      className="text-sm text-foreground flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-primary/60" />
                      {v}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Livery Data Section */}
        <div className="mb-12">
          <LiveriesSection liveries={post.liveries} />
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
