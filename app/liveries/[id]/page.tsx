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

  // Basic validation for Convex ID format
  const isValidId = postId && /^[a-zA-Z0-9_-]{5,}$/.test(postId);

  // Fetch post data with liveries
  const post = useQuery(
    api.posts.getPost,
    isValidId ? { postId: postId as Id<"posts"> } : "skip",
  );

  // Fetch related liveries
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

  const toggleLike = useMutation(api.likes.toggleLike);
  const toggleFavorite = useMutation(api.favorites.toggleFavorite);

  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const relatedPosts =
    relatedResult?.posts?.filter((p) => p._id !== postId) ?? [];

  const handleLike = async () => {
    if (isLiking || !post) return;
    setIsLiking(true);
    try {
      await toggleLike({ postId: postId as Id<"posts"> });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to like";
      toast.error(
        message.includes("logged in") ? "Sign in required" : "Failed to like",
      );
    } finally {
      setIsLiking(false);
    }
  };

  const handleFavorite = async () => {
    if (isSaving || !post) return;
    setIsSaving(true);
    try {
      await toggleFavorite({ postId: postId as Id<"posts"> });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save";
      toast.error(
        message.includes("logged in") ? "Sign in required" : "Failed to save",
      );
    } finally {
      setIsLiking(false);
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: post?.title || "Livery", url: url });
      } catch {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  if (isValidId && post === undefined) return <LiveryDetailSkeleton />;

  if (!isValidId || post === null) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Livery Not Found</h1>
          <Button asChild>
            <Link href="/liveries">Back to Liveries</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const isAuthor = session?.user?.id === post.authorId;
  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen pb-20 pt-24">
      <div className="px-4 md:px-24 lg:px-48">
        {/* Main Header Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-6 items-stretch">
          {/* Left: Image Gallery (Anchor) */}
          <div className="flex flex-col">
            <LiveryImageGallery
              imageUrls={post.imageUrls}
              title={post.title}
              activeIndex={activeIndex}
              onActiveIndexChange={setActiveIndex}
              hideThumbnails
            />
          </div>

          {/* Right: Info Panel (Perfect Image Alignment) */}
          <div className="flex flex-col justify-between">
            {/* Top Block: Navigation, Metadata, and Title */}
            <div className="space-y-6">
              {/* 1. TOP BAR: Nav & Date */}
              <div className="flex items-center">
                <Link
                  href="/liveries"
                  className="group flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-all"
                >
                  <ArrowLeft
                    size={14}
                    className="group-hover:-translate-x-1 transition-transform"
                  />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Exit to Feed
                  </span>
                </Link>
              </div>

              {/* 2. TITLE SECTION: Badges, Title, and Creator ONLY */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {post.vehicleTypes?.map((type: string) => (
                    <Badge
                      key={type}
                      className="bg-primary/10 text-primary border-primary/20 px-1.5 py-0 h-5 text-[9px] font-black uppercase tracking-wider rounded"
                    >
                      {type}
                    </Badge>
                  ))}
                </div>

                <h1 className="text-3xl md:text-5xl font-black text-foreground leading-[1] tracking-tight">
                  {post.title}
                </h1>

                {/* Simplified Creator Line - Larger and directly below title */}
                <div className="flex items-center gap-3 pt-1">
                  <Avatar className="h-8 w-8 border border-border/40 shadow-sm">
                    <AvatarImage src={post.author?.image || undefined} />
                    <AvatarFallback className="bg-muted text-[10px] font-black">
                      {post.author?.displayName?.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-base font-bold text-foreground">
                    {post.author?.displayName}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. BOTTOM BAR: Actions & Edit (No separator) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-muted/20 border border-border/40 rounded-lg p-1">
                  <button
                    onClick={handleLike}
                    disabled={isLiking}
                    className={cn(
                      "flex items-center gap-2 px-3 h-8 rounded-md transition-all group",
                      post.isLiked
                        ? "text-rose-500"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Heart
                      size={14}
                      className={cn(
                        "transition-transform group-hover:scale-110",
                        post.isLiked && "fill-rose-500",
                      )}
                    />
                    <span className="text-[10px] font-black">
                      {post.likeCount}
                    </span>
                  </button>
                  <div className="h-4 w-px bg-border/40 mx-1" />
                  <button
                    onClick={handleFavorite}
                    disabled={isSaving}
                    className={cn(
                      "flex items-center gap-2 px-3 h-8 rounded-md transition-all group",
                      post.isFavorited
                        ? "text-amber-500"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Bookmark
                      size={14}
                      className={cn(
                        "transition-transform group-hover:scale-110",
                        post.isFavorited && "fill-amber-500",
                      )}
                    />
                    <span className="text-[10px] font-black">
                      {post.favoriteCount}
                    </span>
                  </button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 rounded-lg border-border/40 hover:bg-muted text-muted-foreground"
                  onClick={handleShare}
                >
                  <Share2 size={14} />
                </Button>
              </div>

              {isAuthor && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-lg border-primary/20 bg-primary/5 text-primary hover:bg-primary/20 transition-all font-bold h-9 text-[10px] uppercase tracking-wider px-4"
                  onClick={() => router.push(`/liveries/${postId}/edit`)}
                >
                  <Pencil size={12} />
                  Edit Livery
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Independent Thumbnails Row */}
        {post.imageUrls.length > 1 && (
          <div className="mb-24 mt-4 w-1/2">
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {post.imageUrls.map((url: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "relative shrink-0 w-24 h-15 rounded-xl overflow-hidden transition-all duration-300 border",
                    activeIndex === index
                      ? "border-primary ring-2 ring-primary/20 scale-95 opacity-100"
                      : "border-transparent grayscale-[0.3] opacity-60 hover:opacity-100 hover:grayscale-0",
                  )}
                >
                  <Image
                    src={url}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Separator */}
        <div className="h-px bg-border/40 mb-16" />

        {/* Bottom Detailed Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-12">
            {/* Compatibility Mini-Card moved to main content area */}
            <section className="bg-muted/10 border border-border/40 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Plane size={18} className="text-primary" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80">
                  Vehicle Compatibility
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {(post.vehicles || [post.vehicle]).map((v, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-card border border-border text-sm font-medium text-foreground shadow-sm"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-1 bg-primary rounded-full" />
                  <h2 className="text-lg font-black text-foreground uppercase tracking-wider">
                    Project Overview
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground/30 text-[10px] font-bold uppercase tracking-[0.2em]">
                  <Calendar size={12} />
                  <span>{formattedDate}</span>
                </div>
              </div>
              <div className="prose prose-invert prose-p:text-muted-foreground/90 prose-p:leading-relaxed prose-p:text-sm max-w-none whitespace-pre-wrap">
                {post.description || "No full description provided."}
              </div>
            </section>
          </div>

          <div className="lg:col-span-5">
            <LiveriesSection liveries={post.liveries} />
          </div>
        </div>

        {/* Related Liveries */}
        {relatedPosts.length > 0 && (
          <section className="mt-32 space-y-8">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-5 w-1 bg-primary rounded-full" />
                <h2 className="text-lg font-black text-foreground uppercase tracking-wider">
                  Related Work
                </h2>
              </div>
              <Button
                variant="ghost"
                className="text-primary font-bold uppercase tracking-widest text-[9px] h-8"
                asChild
              >
                <Link href="/liveries">See More</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedPosts.slice(0, 4).map((relatedPost) => (
                <LiveryCardEnhanced
                  key={relatedPost._id}
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
                  createdAt={relatedPost._creationTime}
                  likeCount={relatedPost.likeCount}
                  favoriteCount={relatedPost.favoriteCount}
                  liveryCount={relatedPost.liveryCount}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function LiveryDetailSkeleton() {
  return (
    <div className="min-h-screen pb-16 pt-24 bg-background">
      <div className="px-4 md:px-24 lg:px-48">
        <Skeleton className="h-4 w-24 mb-6 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <Skeleton className="aspect-[16/10] rounded-2xl" />
          <div className="flex flex-col justify-between py-1">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-40 rounded-full" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-32 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
