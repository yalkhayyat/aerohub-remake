"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { LiveriesSearch } from "./liveries-search";

interface LiveriesHeroProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  className?: string;
}

export function LiveriesHero({
  searchValue,
  onSearchChange,
  className,
}: LiveriesHeroProps) {
  return (
    <section
      className={cn("relative py-24 md:py-32 overflow-hidden", className)}
    >
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/delta.png"
          alt="Background"
          fill
          className="object-cover opacity-30"
          priority
        />
        {/* Gradient Overlay to blend with page background */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
      </div>

      {/* Background gradients - more organic, no harsh edges */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Top gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

        {/* Soft left orb */}
        <div
          className="absolute top-0 left-0 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
          }}
        />

        {/* Soft right orb - positioned to fade naturally */}
        <div
          className="absolute top-1/2 right-0 w-[500px] h-[500px] translate-x-1/3 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 60%)",
          }}
        />

        {/* Bottom center glow */}
        <div
          className="absolute bottom-0 left-1/2 w-[800px] h-[400px] -translate-x-1/2 translate-y-1/2"
          style={{
            background:
              "radial-gradient(ellipse, hsl(var(--primary) / 0.03) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Abstract airplane silhouettes - CSS only */}
        <div className="absolute top-20 left-[10%] w-8 h-8 rotate-45 border-2 border-primary/10 rounded-sm animate-pulse" />
        <div
          className="absolute top-32 right-[15%] w-6 h-6 rotate-12 border-2 border-primary/10 rounded-sm animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
        <div
          className="absolute bottom-16 left-[20%] w-4 h-4 -rotate-12 border-2 border-primary/10 rounded-sm animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-40 left-[60%] w-5 h-5 rotate-[30deg] border-2 border-primary/10 rounded-sm animate-pulse"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 text-center">
        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="text-foreground">Discover </span>
          <span className="bg-gradient-to-b from-white via-primary to-primary bg-clip-text text-transparent">
            Liveries
          </span>
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
          Browse hundreds of custom liveries created by the Aeronautica
          community. Find the perfect look for your aircraft.
        </p>

        {/* Search */}
        <LiveriesSearch
          value={searchValue}
          onChange={onSearchChange}
          className="max-w-xl"
        />
      </div>
    </section>
  );
}
