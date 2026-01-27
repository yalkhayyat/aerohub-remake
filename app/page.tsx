import CrossfadeImage from "@/app/ui/crossfade-image";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  FeaturedLiveries,
  PopularLiveries,
  LatestLiveries,
} from "@/components/home/LiveryShowcase";

const images = [
  // "/carousel/img1.png",
  // "/carousel/img2.png",
  "/carousel/img3.png",
  // "/carousel/img4.png",
  // "/carousel/img5.png",
];

function HeroSection() {
  return (
    <div className="relative w-full h-[80vh] mb-[20vh]">
      {/* Background Image */}
      <CrossfadeImage images={images} className="" intervalMs={5000} />

      {/* Text Holder & Background Gradient */}
      <div className="absolute inset-0 z-10 flex items-end text-foreground bg-linear-180 from-background/30 via-background/30 via-70% to-background px-4 md:px-24 lg:px-48">
        {/* Hero Text */}
        <h1 className="pb-4">
          {/* Title */}
          <span className="font-bold text-5xl md:text-7xl">Aeronautica </span>
          <span className="font-bold text-5xl md:text-7xl bg-gradient-to-b from-white via-primary to-primary bg-clip-text text-transparent">
            Liveries
          </span>

          {/* Description */}
          <span className="block font-semibold text-foreground/70 mt-4 w-full md:w-2/3">
            AEROHUB is the central destination for Aeronautica liveries, built
            for the Aeronautica community.
          </span>

          {/* Call to Action */}
          <a href="#featured">
            <Button size={"lg"} className="mt-4">
              Explore Liveries
              <ChevronDown />
            </Button>
          </a>
        </h1>
      </div>

      {/* Background Credits */}
      <span className="absolute left-1/2 transform -translate-x-1/2 text-right font-extralight italic text-sm text-foreground/30 w-full md:w-2/3 hidden md:block">
        Screenshot by @teamdgl
      </span>

      {/* Background Credits */}
      <span className="font-extralight italic text-sm text-foreground/30 w-full md:w-2/3 md:hidden ml-4">
        Screenshot by @teamdgl
      </span>

      {/* Bouncing Arrow */}
      <div className="absolute -bottom-32 left-1/2 transform -translate-x-1/2">
        <ChevronDown className="animate-bounce text-foreground/70" />
      </div>
    </div>
  );
}

function ContentSection() {
  return (
    <div className="">
      <div className="w-full bg-black/20 py-32">
        <FeaturedLiveries />
      </div>
      <div className="w-full py-32">
        <PopularLiveries />
      </div>

      <div className="w-full bg-black/20 py-32">
        <LatestLiveries />
      </div>
    </div>
  );
}

export default async function Home() {
  return (
    <>
      <HeroSection />
      <ContentSection />
    </>
  );
}
