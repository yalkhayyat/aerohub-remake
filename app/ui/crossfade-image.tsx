"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

type CrossfadeImageProps = {
  images: string[];
  intervalMs?: number;
  className?: string;
};

export default function CrossfadeImage({
  images,
  intervalMs = 3000,
  className,
}: CrossfadeImageProps) {
  const [index, setIndex] = useState(0);

  function getNextIndex(prevIndex: number) {
    return prevIndex + 1 >= images.length ? 0 : prevIndex + 1;
  }

  function setNextIndex() {
    setIndex(getNextIndex);
  }

  useEffect(
    function setupInterval() {
      const interval = setInterval(setNextIndex, intervalMs);
      return function cleanup() {
        clearInterval(interval);
      };
    },
    [intervalMs]
  );

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className || ""}`}
    >
      {images.map(function renderImage(src, i) {
        return (
          <Image
            key={i}
            src={src}
            alt=""
            fill
            className={
              "absolute top-0 left-0 w-full h-full object-cover object-left transition-opacity duration-1000 " +
              (i === index ? "opacity-100" : "opacity-0")
            }
          />
        );
      })}
    </div>
  );
}
