"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiveryImageGalleryProps {
  imageUrls: string[];
  title: string;
  className?: string;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  hideThumbnails?: boolean;
}

export function LiveryImageGallery({
  imageUrls,
  title,
  className,
  activeIndex: externalIndex,
  onActiveIndexChange,
  hideThumbnails = false,
}: LiveryImageGalleryProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [imageError, setImageError] = useState<Set<number>>(new Set());

  const activeIndex =
    externalIndex !== undefined ? externalIndex : internalIndex;
  const setActiveIndex = (index: number) => {
    if (onActiveIndexChange) {
      onActiveIndexChange(index);
    } else {
      setInternalIndex(index);
    }
  };

  const hasMultiple = imageUrls.length > 1;
  const currentImage = imageUrls[activeIndex];

  const goToPrev = () => {
    setActiveIndex(activeIndex === 0 ? imageUrls.length - 1 : activeIndex - 1);
  };

  const goToNext = () => {
    setActiveIndex(activeIndex === imageUrls.length - 1 ? 0 : activeIndex + 1);
  };

  const handleImageError = (index: number) => {
    setImageError((prev) => new Set(prev).add(index));
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Main Image Container */}
      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-muted/20 border border-border group/main shadow-xl w-full">
        {currentImage && !imageError.has(activeIndex) ? (
          <Image
            src={currentImage}
            alt={`${title} - Image ${activeIndex + 1}`}
            fill
            className="object-cover transition-transform duration-700 group-hover/main:scale-105"
            priority
            onError={() => handleImageError(activeIndex)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">
              No Image Available
            </span>
          </div>
        )}

        {/* Navigation Arrows */}
        {hasMultiple && (
          <div className="absolute inset-0 opacity-0 group-hover/main:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/20 to-transparent" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/20 to-transparent" />

            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full h-10 w-10 border border-white/20 pointer-events-auto shadow-lg"
              onClick={goToPrev}
            >
              <ChevronLeft size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full h-10 w-10 border border-white/20 pointer-events-auto shadow-lg"
              onClick={goToNext}
            >
              <ChevronRight size={20} />
            </Button>
          </div>
        )}

        {/* Image Counter */}
        {hasMultiple && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white/90 text-[10px] font-bold uppercase tracking-[0.2em] border border-white/10">
            {activeIndex + 1} <span className="opacity-40 mx-1">/</span>{" "}
            {imageUrls.length}
          </div>
        )}
      </div>

      {/* Optional In-Place Thumbnails */}
      {hasMultiple && !hideThumbnails && (
        <LiveryThumbnails
          imageUrls={imageUrls}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          imageError={imageError}
          onImageError={handleImageError}
        />
      )}
    </div>
  );
}

export function LiveryThumbnails({
  imageUrls,
  activeIndex,
  setActiveIndex,
  imageError,
  onImageError,
  className,
}: {
  imageUrls: string[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  imageError: Set<number>;
  onImageError: (i: number) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("flex gap-3 overflow-x-auto pt-4 no-scrollbar", className)}
    >
      {imageUrls.map((url, index) => (
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
          {!imageError.has(index) ? (
            <Image
              src={url}
              alt={`Thumbnail ${index + 1}`}
              fill
              className="object-cover"
              onError={() => onImageError(index)}
            />
          ) : (
            <div className="absolute inset-0 bg-muted/20 flex items-center justify-center">
              <span className="text-[10px] font-black text-muted-foreground opacity-40">
                ?
              </span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
