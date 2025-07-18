"use client";

import {
  Carousel,
  CarouselContent,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import React, { ReactNode, useEffect, useState, useRef } from "react";
import Autoplay from "embla-carousel-autoplay";

type ContentWheelProps = {
  children?: ReactNode;
};

export function ContentWheel({ children }: ContentWheelProps): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const autoplay = useRef(
    Autoplay({
      delay: 3000,
      stopOnMouseEnter: true,
    })
  );

  useEffect(() => {
    if (!api) return;

    const updateState = () => {
      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap());
    };

    updateState();

    api.on("select", updateState);

    const ro = new ResizeObserver(() => updateState());
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      api.off("select", updateState);
      ro.disconnect();
    };
  }, [api]);

  return (
    <div ref={containerRef} className="w-full">
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
          className="hidden md:flex"
          onClick={() => {
            autoplay.current.stop();
            api?.scrollPrev();
          }}
        />
        <CarouselNext
          variant="secondary"
          className="hidden md:flex"
          onClick={() => {
            autoplay.current.stop();
            api?.scrollNext();
          }}
        />
      </Carousel>

      <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: count }).map((_, index) => (
          <span
            key={index}
            className={`h-2 w-2 rounded-full ${
              index === current ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
