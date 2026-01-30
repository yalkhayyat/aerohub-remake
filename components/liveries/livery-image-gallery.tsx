import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ContentWheel } from "@/app/ui/content-wheel";
import { CarouselItem, type CarouselApi } from "@/components/ui/carousel";

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
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageError, setImageError] = useState<Set<number>>(new Set());
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const hasMultiple = imageUrls.length > 1;

  // Sync activeIndex with carousel selection
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setActiveIndex(api.selectedScrollSnap());
    };

    onSelect();
    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (hasMultiple && thumbnailRefs.current[activeIndex]) {
      thumbnailRefs.current[activeIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeIndex, hasMultiple]);

  const handleThumbnailClick = (index: number) => {
    api?.scrollTo(index);
  };

  const handleImageError = (index: number) => {
    setImageError((prev) => new Set(prev).add(index));
  };

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div
        className={cn(
          "relative aspect-[16/10] rounded-2xl overflow-hidden bg-muted flex items-center justify-center border border-border/40",
          className,
        )}
      >
        <span className="text-muted-foreground">No Image Available</span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Carousel Container */}
      <ContentWheel
        setApi={setApi}
        showDots={false}
        className="rounded-2xl overflow-hidden group"
      >
        {imageUrls.map((url, index) => (
          <CarouselItem key={index}>
            <div className="relative aspect-[16/10] bg-muted/20 overflow-hidden rounded-2xl border border-border/40 transition-all duration-500">
              {!imageError.has(index) ? (
                <>
                  {/* Blurred Backdrop - Preserves color and fills frame without cropping the subject */}
                  <Image
                    src={url}
                    alt=""
                    fill
                    className="object-cover blur-xl opacity-60 scale-110"
                    aria-hidden="true"
                  />
                  {/* Main Image - Contained to show full data without any cropping */}
                  <Image
                    src={url}
                    alt={`${title} - Image ${index + 1}`}
                    fill
                    className="object-contain relative z-10 transition-transform duration-700 hover:scale-[1.01]"
                    priority={index === 0}
                    onError={() => handleImageError(index)}
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">
                    Image failed to load
                  </span>
                </div>
              )}
            </div>
          </CarouselItem>
        ))}
      </ContentWheel>

      {/* Thumbnail Strip Container */}
      {hasMultiple && (
        <div className="relative mt-2 group/thumbnails overflow-hidden">
          {/* Side Fades - Hints at more content */}
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background via-background/20 to-transparent z-20 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background via-background/20 to-transparent z-20 pointer-events-none" />

          {/* Scrollable Strip */}
          <div className="flex gap-4 overflow-x-auto overflow-y-hidden pt-4 pb-8 px-4 scrollbar-hide snap-x snap-proximity">
            {imageUrls.map((url, index) => (
              <div key={index} className="snap-center shrink-0">
                <button
                  ref={(el) => {
                    thumbnailRefs.current[index] = el;
                  }}
                  onClick={() => handleThumbnailClick(index)}
                  className={cn(
                    "relative w-24 h-15 rounded-xl overflow-hidden border-2 transition-all duration-300 outline-none",
                    activeIndex === index
                      ? "border-primary scale-110 z-10 shadow-xl shadow-primary/20"
                      : "border-border/40 hover:border-primary/40 opacity-50 hover:opacity-100 hover:scale-105",
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
                      <span className="text-xs text-muted-foreground font-black">
                        ?
                      </span>
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
