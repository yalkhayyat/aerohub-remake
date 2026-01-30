"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useUploadFile } from "@convex-dev/r2/react";
import { Loader2, ArrowLeft } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
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
    if (!title.trim()) return false;
    if (vehicles.length === 0) return false;
    if (images.length === 0 && initialImageKeys.length === 0) return false;
    if (liveries.length === 0) return false;
    // Check all liveries have at least one valid key-value
    if (liveries.some((l) => l.keyValues.every((kv) => !kv.key.trim()))) {
      return false;
    }
    return true;
  }, [title, vehicles, images, initialImageKeys, liveries]);

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

      // Upload NEW images to R2
      const updatedImages = [...images];

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        // If it's a new image (not uploaded or no key) and has a file
        if (!img.uploaded && img.file) {
          updatedImages[i] = { ...updatedImages[i], uploading: true };
          setImages([...updatedImages]);

          try {
            const key = await uploadFile(img.file);
            finalImageKeys.push(key);
            updatedImages[i] = {
              ...updatedImages[i],
              uploading: false,
              uploaded: true,
              key,
            };
          } catch (uploadError) {
            updatedImages[i] = {
              ...updatedImages[i],
              uploading: false,
              error: "Upload failed",
            };
            throw new Error(`Failed to upload image ${i + 1}`);
          }
          setImages([...updatedImages]);
        }
      }

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
        description: description.trim() || undefined,
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
                      <Label className="text-foreground/80">Title</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isSubmitting}
                        className="bg-muted/10 border-border/50 focus:border-primary/50 text-lg h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground/80">Description</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isSubmitting}
                        className="bg-muted/10 border-border/50 focus:border-primary/50 min-h-[240px] resize-none"
                      />
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
