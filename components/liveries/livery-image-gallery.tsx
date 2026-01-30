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
}

export function LiveryImageGallery({
  imageUrls,
  title,
  className,
}: LiveryImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageError, setImageError] = useState<Set<number>>(new Set());

  const hasMultiple = imageUrls.length > 1;
  const currentImage = imageUrls[activeIndex];

  const goToPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));
  };

  const handleImageError = (index: number) => {
    setImageError((prev) => new Set(prev).add(index));
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Main Image */}
      <div className="relative aspect-[16/10] md:aspect-auto md:flex-1 md:min-h-[300px] rounded-2xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted/20 shadow-lg shadow-black/5 dark:shadow-black/20">
        {currentImage && !imageError.has(activeIndex) ? (
          <Image
            src={currentImage}
            alt={`${title} - Image ${activeIndex + 1}`}
            fill
            className="object-cover transition-transform duration-500 hover:scale-[1.02]"
            priority
            onError={() => handleImageError(activeIndex)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-muted-foreground">No Image Available</span>
          </div>
        )}

        {/* Navigation Arrows */}
        {hasMultiple && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105"
              onClick={goToPrev}
            >
              <ChevronLeft size={22} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105"
              onClick={goToNext}
            >
              <ChevronRight size={22} />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {hasMultiple && (
          <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-sm font-medium shadow-lg">
            {activeIndex + 1} / {imageUrls.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-2 mt-4">
          {imageUrls.map((url, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all",
                activeIndex === index
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border/50 hover:border-border opacity-70 hover:opacity-100",
              )}
            >
              {!imageError.has(index) ? (
                <Image
                  src={url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(index)}
                />
              ) : (
                <div className="absolute inset-0 bg-muted flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">?</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
