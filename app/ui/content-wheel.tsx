"use client";

import LiveryCard from "@/app/ui/livery-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import React, { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
type ContentWheelProps = {
  children?: ReactNode;
};

export function ContentWheel({ children }: ContentWheelProps): ReactNode {
  const isMobile = useIsMobile();

  return (
    <Carousel
      className="w-full"
      opts={{
        align: "start",
        slidesToScroll: "auto",
      }}
    >
      <CarouselContent>{children}</CarouselContent>
      {!isMobile ? (
        <>
          <CarouselPrevious />
          <CarouselNext />
        </>
      ) : null}
    </Carousel>
  );
}
