"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useUploadFile } from "@convex-dev/r2/react";
import { Loader2, ArrowLeft } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VehicleSelector } from "@/components/posts/VehicleSelector";
import {
  ImageUploader,
  type ImageFile,
} from "@/components/posts/ImageUploader";
import { LiveryEditor } from "@/components/posts/LiveryEditor";
import type { Vehicle } from "@/types/vehicle";
import type { LiveryInput } from "@/types/post";
import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";

const MAX_TITLE_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 5000;

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  // Basic validation for Convex ID format
  const isValidId = postId && /^[a-zA-Z0-9_-]{5,}$/.test(postId);

  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();

  // Fetch existing post data
  const post = useQuery(
    api.posts.getPost,
    isValidId ? { postId: postId as Id<"posts"> } : "skip",
  );

  // Form state
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [vehicles, setVehicles] = React.useState<string[]>([]);
  const [images, setImages] = React.useState<ImageFile[]>([]);
  const [liveries, setLiveries] = React.useState<LiveryInput[]>([]);
  const [initialImageKeys, setInitialImageKeys] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Convex hooks
  const uploadFile = useUploadFile(api.r2);
  const updatePost = useMutation(api.posts.updatePost);

  // Initialize form with post data
  React.useEffect(() => {
    if (post && !isInitialized) {
      setTitle(post.title);
      setDescription(post.description || "");
      if (post.vehicles && post.vehicles.length > 0) {
        setVehicles(post.vehicles);
      } else if (post.vehicle) {
        // Fallback for old posts
        setVehicles([post.vehicle]);
      }
      setInitialImageKeys(post.imageKeys || []);

      // Existing images
      const existingImages: ImageFile[] = post.imageUrls.map((url, i) => ({
        file: new File([], "existing"), // Mock file for UI
        preview: url,
        uploaded: true,
        key: post.imageKeys[i],
      }));
      setImages(existingImages);

      // Existing liveries
      if (post.liveries) {
        setLiveries(
          post.liveries.map((l) => ({
            title: l.title,
            keyValues: l.keyValues,
            advancedCustomization: l.advancedCustomization,
          })),
        );
      }

      setIsInitialized(true);
    }
  }, [post, isInitialized]);

  // Redirect if not authenticated or not the author
  React.useEffect(() => {
    if (!isSessionLoading && !session) {
      router.push(`/login?redirect=/liveries/${postId}/edit`);
      return;
    }
    // Redirect non-authors to view page (security fix)
    if (post && session && post.authorId !== session.user.id) {
      router.push(`/liveries/${postId}`);
    }
  }, [session, isSessionLoading, router, postId, post]);

  // Validation
  const isValid = React.useMemo(() => {
    if (!title.trim() || title.length > MAX_TITLE_LENGTH) return false;
    if (description.length > MAX_DESCRIPTION_LENGTH) return false;
    if (vehicles.length === 0) return false;
    if (images.length === 0 && initialImageKeys.length === 0) return false;
    if (liveries.length === 0) return false;

    // Check all liveries follow rules
    const hasInvalidLivery = liveries.some((l) => {
      // Must have at least one part and all parts must have names
      const hasEmptyPart = l.keyValues.every((kv) => !kv.key.trim());
      if (hasEmptyPart) return true;

      // Check lengths and types
      const hasRuleViolation = l.keyValues.some(
        (kv) =>
          kv.key.length > 20 ||
          kv.value.length > 20 ||
          (kv.value !== "" && !/^\d+$/.test(kv.value)),
      );
      if (hasRuleViolation) return true;

      // Advanced customization
      if ((l.advancedCustomization?.length ?? 0) > 500) return true;

      return false;
    });

    if (hasInvalidLivery) return false;

    return true;
  }, [title, description, vehicles, images, initialImageKeys, liveries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting || !post) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Start with existing image keys that are still present
      const finalImageKeys: string[] = initialImageKeys.filter((key) =>
        images.some((img) => img.key === key && img.uploaded),
      );

      // Upload NEW images to R2 concurrently
      const uploadPromises = images.map(async (image, index) => {
        // If it's already uploaded or has no file (legacy/existing), keep as is
        if (image.uploaded || !image.file) {
          return null;
        }

        // Set this specific image to uploading
        setImages((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], uploading: true };
          return next;
        });

        try {
          const key = await uploadFile(image.file);
          setImages((prev) => {
            const next = [...prev];
            next[index] = {
              ...next[index],
              uploading: false,
              uploaded: true,
              key,
            };
            return next;
          });
          return key;
        } catch (uploadError) {
          setImages((prev) => {
            const next = [...prev];
            next[index] = {
              ...next[index],
              uploading: false,
              error: "Upload failed",
            };
            return next;
          });
          throw new Error(`Failed to upload image ${index + 1}`);
        }
      });

      const newKeys = await Promise.all(uploadPromises);
      // Combine existing keys with newly uploaded keys
      finalImageKeys.push(
        ...(newKeys.filter((key) => key !== null) as string[]),
      );

      // Filter liveries
      const validLiveries = liveries.map((livery, index) => ({
        title: livery.title?.trim() || `Livery ${index + 1}`,
        keyValues: livery.keyValues.filter((kv) => kv.key.trim()),
        advancedCustomization: livery.advancedCustomization,
      }));

      // Update the post
      await updatePost({
        postId: params.id as Id<"posts">,
        title: title.trim(),
        description: description.trim(),
        vehicles: vehicles,
        imageKeys: finalImageKeys,
        liveries: validLiveries,
      });

      // Redirect back to the post
      router.push(`/liveries/${postId}`);
    } catch (err) {
      console.error("Failed to update post:", err);
      setError(err instanceof Error ? err.message : "Failed to update post");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state (only for valid IDs)
  if (isSessionLoading || (isValidId && post === undefined)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Redirect to liveries if invalid ID or post not found
  if (!isValidId || !session || !post) {
    router.push("/liveries");
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      </div>

      <div className="relative z-10">
        <div className="container mx-auto px-4 pt-24 pb-12 min-h-screen">
          <div className="w-full max-w-[95%] 2xl:max-w-[90%] mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="rounded-full"
                >
                  <Link href={`/liveries/${postId}`}>
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Edit Post</h1>
                  <p className="text-muted-foreground">
                    Modify your livery details
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Left Column: General & Images */}
              <div className="space-y-10 lg:sticky lg:top-24 lg:self-start">
                <section className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                    <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                      General
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-foreground/80">Title</Label>
                        <span
                          className={cn(
                            "text-[10px] text-muted-foreground transition-colors",
                            title.length > MAX_TITLE_LENGTH &&
                              "text-destructive font-bold",
                          )}
                        >
                          {title.length}/{MAX_TITLE_LENGTH}
                        </span>
                      </div>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isSubmitting}
                        className={cn(
                          "bg-muted/10 border-border/50 focus:border-primary/50 text-lg h-12 transition-all",
                          title.length > MAX_TITLE_LENGTH &&
                            "border-destructive focus:border-destructive",
                        )}
                      />
                      {title.length > MAX_TITLE_LENGTH && (
                        <p className="text-[11px] text-destructive px-1">
                          Title must be {MAX_TITLE_LENGTH} characters or less
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-foreground/80">
                          Description
                        </Label>
                        <span
                          className={cn(
                            "text-[10px] text-muted-foreground transition-colors",
                            description.length > MAX_DESCRIPTION_LENGTH &&
                              "text-destructive font-bold",
                          )}
                        >
                          {description.length}/{MAX_DESCRIPTION_LENGTH}
                        </span>
                      </div>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isSubmitting}
                        className={cn(
                          "bg-muted/10 border-border/50 focus:border-primary/50 min-h-[240px] resize-none transition-all",
                          description.length > MAX_DESCRIPTION_LENGTH &&
                            "border-destructive focus:border-destructive",
                        )}
                      />
                      {description.length > MAX_DESCRIPTION_LENGTH && (
                        <p className="text-[11px] text-destructive px-1">
                          Description must be {MAX_DESCRIPTION_LENGTH}{" "}
                          characters or less
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                    <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                      Images
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <ImageUploader
                      images={images}
                      onImagesChange={setImages}
                      disabled={isSubmitting}
                      maxImages={12}
                    />
                  </div>
                </section>
              </div>

              {/* Right Column: Configuration & Actions */}
              <div className="space-y-10">
                <section className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                    <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                      Configuration
                    </h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-foreground/80">
                        Vehicle Models
                      </Label>
                      <div className="relative">
                        <VehicleSelector
                          value={vehicles}
                          onValueChange={setVehicles}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <LiveryEditor
                        liveries={liveries}
                        onLiveriesChange={setLiveries}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </section>

                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end gap-4 pt-4 border-t border-border/50">
                  <Button
                    variant="ghost"
                    onClick={() => router.push(`/liveries/${postId}`)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!isValid || isSubmitting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px] rounded-full h-11"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>Save Changes</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
