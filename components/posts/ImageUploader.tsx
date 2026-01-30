"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, Loader2 } from "lucide-react";
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
  const handleFiles = React.useCallback(
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

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
      }
    },
    [images, maxImages, maxSizeBytes, onImagesChange],
  );

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      handleFiles(acceptedFiles);
    },
    [handleFiles],
  );

  // Handle paste events
  React.useEffect(() => {
    if (disabled || images.length >= maxImages) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        handleFiles(pastedFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [disabled, images.length, maxImages, handleFiles]);

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
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  // Memory management for object URLs
  const previousUrlsRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    const currentUrls = new Set(images.map((img) => img.preview));
    previousUrlsRef.current.forEach((url) => {
      if (!currentUrls.has(url) && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });
    previousUrlsRef.current = currentUrls;
  }, [images]);

  React.useEffect(() => {
    return () => {
      previousUrlsRef.current.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Grid Layout - Mixed Dropzone + Images */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
        {/* Render images first */}
        {images.map((image, index) => (
          <div
            key={index}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-xl border border-border/50 bg-muted/10 backdrop-blur-sm shadow-sm transition-all hover:border-primary/50",
              // First image is "Cover"
              index === 0 &&
                "col-span-2 row-span-2 border-primary/20 ring-1 ring-primary/20",
            )}
          >
            <img
              src={image.preview}
              alt={`Upload ${index + 1}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Cover Badge */}
            {index === 0 && (
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm backdrop-blur-md">
                Cover Image
              </div>
            )}

            {/* Upload status overlay */}
            {image.uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}

            {image.error && (
              <div className="absolute inset-0 flex items-center justify-center bg-destructive/60 backdrop-blur-[1px]">
                <span className="text-xs text-white font-medium">Error</span>
              </div>
            )}

            {/* Remove button */}
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 rounded-full"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        {/* Dropzone Tile - Always visible at the end until full */}
        {canAddMore && (
          <div
            {...getRootProps()}
            className={cn(
              "aspect-square flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer hover:border-primary/50 hover:bg-muted/20",
              isDragActive
                ? "border-primary bg-primary/5 scale-[0.98]"
                : "border-muted-foreground/20 bg-muted/10",
              disabled && "cursor-not-allowed opacity-50",
              // If no images, make dropzone prominent
              images.length === 0 &&
                "col-span-full aspect-[21/9] sm:aspect-[21/9]",
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2 text-center p-4">
              {images.length === 0 ? (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Click to upload</p>
                  <p className="text-sm text-muted-foreground">
                    drag and drop, or <b>paste</b> screenshots
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground font-medium">
                  Add Image
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {images.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Upload at least one image to continue. First image is your cover.
        </p>
      )}
    </div>
  );
}

export type { ImageFile };
