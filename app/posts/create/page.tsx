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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VehicleSelector } from "@/components/posts/VehicleSelector";
import {
  ImageUploader,
  type ImageFile,
} from "@/components/posts/ImageUploader";
import { LiveryEditor } from "@/components/posts/LiveryEditor";
import type { Vehicle } from "@/types/vehicle";
import type { LiveryInput } from "@/types/post";

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
      router.push("/login?redirect=/posts/create");
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
        title: livery.title?.trim() || `Livery ${index + 1}`, // Pass the customizable title or default
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
      router.push(`/posts/${postId}`);
    } catch (err) {
      console.error("Failed to create post:", err);
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking auth
  if (isSessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#020817] pt-24 pb-8">
      <div className="container mx-auto max-w-3xl px-4">
        <Card className="border-slate-800 bg-[#0f172a] shadow-2xl">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-2xl font-bold">Create a Post</CardTitle>
            <CardDescription>
              Share your livery with the community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Enter a title for your post"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={100}
                  className="bg-slate-900 border-slate-800"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your livery (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                  maxLength={2000}
                  className="bg-slate-900 border-slate-800"
                />
              </div>

              {/* Vehicle Selector */}
              <div className="space-y-2">
                <Label>
                  Vehicle <span className="text-destructive">*</span>
                </Label>
                <VehicleSelector
                  value={vehicle}
                  onValueChange={setVehicle}
                  disabled={isSubmitting}
                />
              </div>

              {/* Images */}
              <div className="space-y-2">
                <Label>
                  Images <span className="text-destructive">*</span>
                </Label>
                <ImageUploader
                  images={images}
                  onImagesChange={setImages}
                  disabled={isSubmitting}
                  maxImages={12}
                  maxSizeBytes={25 * 1024 * 1024}
                />
              </div>

              {/* Liveries */}
              <div className="space-y-2">
                <Label>
                  Livery Data <span className="text-destructive">*</span>
                </Label>
                <LiveryEditor
                  liveries={liveries}
                  onLiveriesChange={setLiveries}
                  disabled={isSubmitting}
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Post"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
