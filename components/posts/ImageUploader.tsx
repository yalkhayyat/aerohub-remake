"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImageFile {
  file: File;
  preview: string;
  uploading?: boolean;
  uploaded?: boolean;
  key?: string; // R2 key after upload
  error?: string;
}

interface ImageUploaderProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxImages?: number;
  maxSizeBytes?: number;
  disabled?: boolean;
}

const DEFAULT_MAX_IMAGES = 12;
const DEFAULT_MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export function ImageUploader({
  images,
  onImagesChange,
  maxImages = DEFAULT_MAX_IMAGES,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  disabled = false,
}: ImageUploaderProps) {
  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      const remainingSlots = maxImages - images.length;
      const filesToAdd = acceptedFiles.slice(0, remainingSlots);

      const newImages: ImageFile[] = filesToAdd
        .filter((file) => {
          if (file.size > maxSizeBytes) {
            console.warn(
              `File ${file.name} exceeds max size of ${maxSizeBytes / 1024 / 1024}MB`,
            );
            return false;
          }
          return true;
        })
        .map((file) => ({
          file,
          preview: URL.createObjectURL(file),
        }));

      onImagesChange([...images, ...newImages]);
    },
    [images, maxImages, maxSizeBytes, onImagesChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    disabled: disabled || images.length >= maxImages,
    multiple: true,
  });

  const removeImage = (index: number) => {
    const newImages = [...images];
    // Revoke the preview URL to avoid memory leaks
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  // Cleanup preview URLs on unmount
  React.useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.preview));
    };
  }, []);

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Image preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              <img
                src={image.preview}
                alt={`Upload ${index + 1}`}
                className="h-full w-full object-cover"
              />

              {/* Upload status overlay */}
              {image.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}

              {image.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/50">
                  <span className="text-xs text-white">Error</span>
                </div>
              )}

              {image.uploaded && (
                <div className="absolute bottom-1 right-1 rounded bg-green-500 px-1.5 py-0.5 text-xs text-white">
                  ✓
                </div>
              )}

              {/* Remove button */}
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {canAddMore && (
        <div
          {...getRootProps()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2 text-center">
            {isDragActive ? (
              <>
                <Upload className="h-10 w-10 text-primary" />
                <p className="text-sm font-medium text-primary">
                  Drop images here...
                </p>
              </>
            ) : (
              <>
                <ImagePlus className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Drag & drop images here, or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  {images.length}/{maxImages} images •{" "}
                  {maxSizeBytes / 1024 / 1024}MB max per image
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Validation message */}
      {images.length === 0 && (
        <p className="text-sm text-destructive">At least 1 image is required</p>
      )}
    </div>
  );
}

export type { ImageFile };
