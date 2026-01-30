"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { useUploadFile } from "@convex-dev/r2/react";
import { Loader2 } from "lucide-react";
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

const MAX_TITLE_LENGTH = 80;
const MAX_LIVERY_TITLE_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 5000;

export default function CreatePostPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();

  // Form state
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [vehicles, setVehicles] = React.useState<string[]>([]);
  const [images, setImages] = React.useState<ImageFile[]>([]);
  const [liveries, setLiveries] = React.useState<LiveryInput[]>([
    { title: "", keyValues: [{ key: "", value: "" }] },
  ]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Convex hooks
  const uploadFile = useUploadFile(api.r2);
  const createPost = useMutation(api.posts.createPost);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isSessionLoading && !session) {
      router.push("/login?redirect=/liveries/create");
    }
  }, [session, isSessionLoading, router]);

  // Validation
  const isValid = React.useMemo(() => {
    if (!title.trim() || title.length > MAX_TITLE_LENGTH) return false;
    if (description.length > MAX_DESCRIPTION_LENGTH) return false;
    if (vehicles.length === 0) return false;
    if (images.length === 0) return false;
    if (liveries.length === 0) return false;

    // Check all liveries have at least one valid key-value and follow rules
    const hasInvalidLivery = liveries.some((l) => {
      // Must have at least one part and all parts must have names
      const hasEmptyPart = l.keyValues.every((kv) => !kv.key.trim());
      if (hasEmptyPart) return true;

      // Check lengths and types
      if ((l.title?.length ?? 0) > MAX_LIVERY_TITLE_LENGTH) return true;

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
  }, [title, description, vehicles, images, liveries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload all images to R2 concurrently
      const updatedImages = [...images];

      // Set all to uploading state initially
      setImages(images.map((img) => ({ ...img, uploading: true })));

      const uploadPromises = images.map(async (image, index) => {
        try {
          const key = await uploadFile(image.file);
          // Use functional update to avoid race conditions
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

      const uploadedKeys = await Promise.all(uploadPromises);

      // Filter liveries to only include valid key-values
      const validLiveries = liveries.map((livery, index) => ({
        title: livery.title?.trim() || `Livery ${index + 1}`,
        keyValues: livery.keyValues.filter((kv) => kv.key.trim()),
        advancedCustomization: livery.advancedCustomization,
      }));

      // Create the post
      const postId = await createPost({
        title: title.trim(),
        description: description.trim(),
        vehicles: vehicles,
        imageKeys: uploadedKeys,
        liveries: validLiveries,
      });

      // Redirect to the new post
      router.push(`/liveries/${postId}`);
    } catch (err) {
      console.error("Failed to create post:", err);
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Background Ambience - Cool tones */}
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

      <div className="relative z-10">
        {/* Header Strip */}

        {/* Main Content Studio Layout */}
        <div className="container mx-auto px-4 pt-24 pb-12 min-h-screen">
          <div className="w-full max-w-[95%] 2xl:max-w-[90%] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left Column: General & Images */}
            <div className="space-y-10 lg:sticky lg:top-24 lg:self-start">
              {/* Section: Details */}
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
                      placeholder="Enter a catchy title"
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
                      <Label className="text-foreground/80">Description</Label>
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
                      placeholder="Tell us about your livery..."
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
                        Description must be {MAX_DESCRIPTION_LENGTH} characters
                        or less
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Section: Images */}
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
                    maxSizeBytes={25 * 1024 * 1024}
                  />
                </div>
              </section>
            </div>

            {/* Right Column: Configuration & Actions */}
            <div className="space-y-10">
              {/* Section: Configuration */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Configuration
                  </h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-foreground/80">Vehicle Models</Label>
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

              {/* Error Banner */}
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive text-sm">
                  {error}
                </div>
              )}

              {/* Action Footer */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-border/50">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/")}
                  disabled={isSubmitting}
                  className="text-muted-foreground hover:text-foreground"
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
                      Publishing...
                    </>
                  ) : (
                    <>Publish Post</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
