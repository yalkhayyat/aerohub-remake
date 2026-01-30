"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import React, { ReactNode, useEffect, useState, useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";

type ContentWheelProps = {
  children?: ReactNode;
  setApi?: (api: CarouselApi) => void;
  className?: string;
  showDots?: boolean;
};

export function ContentWheel({
  children,
  setApi: externalSetApi,
  className,
  showDots = true,
}: ContentWheelProps): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Sync internal api to external setApi
  useEffect(() => {
    if (!api || !externalSetApi) return;
    externalSetApi(api);
  }, [api, externalSetApi]);
  const autoplay = useRef(
    Autoplay({
      delay: 3000,
      stopOnMouseEnter: true,
    }),
  );

  useEffect(() => {
    if (!api) return;

    const updateState = () => {
      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap());
    };

    updateState();

    api.on("select", updateState);

    // Interaction handling to resume autoplay
    const resumeAutoplay = () => {
      // Small delay to ensure manual interaction is truly finished
      setTimeout(() => {
        autoplay.current.play();
      }, 4000);
    };

    api.on("pointerUp", resumeAutoplay);
    api.on("settle", resumeAutoplay);

    const ro = new ResizeObserver(() => updateState());
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      api.off("select", updateState);
      api.off("pointerUp", resumeAutoplay);
      api.off("settle", resumeAutoplay);
      ro.disconnect();
    };
  }, [api]);

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      <Carousel
        setApi={setApi}
        className="w-full"
        opts={{
          align: "start",
          slidesToScroll: "auto",
          loop: true,
        }}
        plugins={[autoplay.current]}
      >
        <CarouselContent>{children}</CarouselContent>
        <CarouselPrevious
          variant="secondary"
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white border-0"
          onClick={() => {
            api?.scrollPrev();
          }}
        />
        <CarouselNext
          variant="secondary"
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white border-0"
          onClick={() => {
            api?.scrollNext();
          }}
        />
      </Carousel>

      {showDots && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: count }).map((_, index) => (
            <span
              key={index}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                index === current ? "bg-primary w-4" : "bg-muted"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
