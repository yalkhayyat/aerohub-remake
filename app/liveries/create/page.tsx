"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { useUploadFile } from "@convex-dev/r2/react";
import { Loader2, Upload } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VehicleSelector } from "@/components/posts/VehicleSelector";
import {
  ImageUploader,
  type ImageFile,
} from "@/components/posts/ImageUploader";
import { LiveryEditor } from "@/components/posts/LiveryEditor";
import type { Vehicle } from "@/types/vehicle";
import type { LiveryInput } from "@/types/post";
import Link from "next/link";

export default function CreatePostPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();

  // Form state
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [vehicle, setVehicle] = React.useState<Vehicle | null>(null);
  const [images, setImages] = React.useState<ImageFile[]>([]);
  const [liveries, setLiveries] = React.useState<LiveryInput[]>([
    { title: "Livery 1", keyValues: [{ key: "", value: "" }] },
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
    if (!title.trim()) return false;
    if (!vehicle) return false;
    if (images.length === 0) return false;
    if (liveries.length === 0) return false;
    // Check all liveries have at least one valid key-value
    if (liveries.some((l) => l.keyValues.every((kv) => !kv.key.trim()))) {
      return false;
    }
    return true;
  }, [title, vehicle, images, liveries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload all images to R2
      const uploadedKeys: string[] = [];
      const updatedImages = [...images];

      for (let i = 0; i < images.length; i++) {
        updatedImages[i] = { ...updatedImages[i], uploading: true };
        setImages([...updatedImages]);

        try {
          const key = await uploadFile(images[i].file);
          uploadedKeys.push(key);
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

      // Filter liveries to only include valid key-values
      const validLiveries = liveries.map((livery, index) => ({
        title: livery.title?.trim() || `Livery ${index + 1}`,
        keyValues: livery.keyValues.filter((kv) => kv.key.trim()),
        advancedCustomization: livery.advancedCustomization,
      }));

      // Create the post
      const postId = await createPost({
        title: title.trim(),
        description: description.trim() || undefined,
        vehicle: vehicle!,
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
                    <Label className="text-foreground/80">Title</Label>
                    <Input
                      placeholder=""
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={isSubmitting}
                      className="bg-muted/10 border-border/50 focus:border-primary/50 text-lg h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground/80">Description</Label>
                    <Textarea
                      placeholder=""
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={isSubmitting}
                      className="bg-muted/10 border-border/50 focus:border-primary/50 min-h-[240px] resize-none"
                    />
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
                    <Label className="text-foreground/80">Vehicle Model</Label>
                    <div className="relative">
                      <VehicleSelector
                        value={vehicle}
                        onValueChange={setVehicle}
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
