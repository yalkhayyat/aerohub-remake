import CrossfadeImage from "@/app/ui/crossfade-image";
import ContentWheelContainer from "@/app/ui/content-wheel-container";
import GetLiveries, { Livery } from "@/lib/get-liveries";
import LiveryCard from "@/app/ui/livery-card";
import { ContentWheel } from "@/app/ui/content-wheel";
import { CarouselItem } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";

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
      <span className="absolute left-1/2 transform -translate-x-1/2 text-right font-extralight italic text-sm text-foreground/30 w-full md:w-2/3">
        Screenshot by @teamdgl
      </span>

      {/* Bouncing Arrow */}
      <div className="absolute -bottom-32 left-1/2 transform -translate-x-1/2">
        <ChevronDown className="animate-bounce text-foreground/70" />
      </div>
    </div>
  );
}

function SeeMoreButton() {
  return (
    <Button variant="link" className="ml-auto">
      See more
      <ArrowRight />
    </Button>
  );
}

const LIVERY_AMOUNT = 15;
async function ContentSection() {
  const featured_liveries = await GetLiveries(LIVERY_AMOUNT, "featured", 0);
  const popular_liveries = await GetLiveries(LIVERY_AMOUNT, "most_popular", 0);
  const latest_liveries = await GetLiveries(LIVERY_AMOUNT, "latest", 0);

  function renderLiveries(liveries: Livery[]) {
    return liveries.map((livery) => (
      <CarouselItem key={livery.id} className="md:basis-1/2 lg:basis-1/3">
        <LiveryCard
          title={livery.title}
          description={livery.description ? livery.description : ""}
          tag={livery.vehicle_name}
          img={livery.images[0]}
          // @ts-ignore TODO: Update to correct username
          username={livery.user_discord_id ? livery.user_discord_id : "Unknown"}
          created_at={new Date(livery.created_at).toLocaleDateString()}
        />
      </CarouselItem>
    ));
  }

  return (
    <div className="">
      <div className="w-full bg-black/20 py-32">
        <ContentWheelContainer
          title="Featured"
          description="This week's top picks."
          className="px-4 md:px-24 lg:px-48"
          sectionId="featured"
          link={SeeMoreButton()}
        >
          <ContentWheel>{renderLiveries(featured_liveries)}</ContentWheel>
        </ContentWheelContainer>
      </div>
      <div className="w-full py-32">
        <ContentWheelContainer
          title="Most Popular"
          description="Highly rated, consistently downloaded, and loved by the community."
          className="px-4 md:px-24 lg:px-48"
          link={SeeMoreButton()}
        >
          <ContentWheel>{renderLiveries(popular_liveries)}</ContentWheel>
        </ContentWheelContainer>
      </div>

      <div className="w-full bg-black/20 py-32">
        <ContentWheelContainer
          title="Latest"
          description="Discover the newest additions to AEROHUB."
          className="px-4 md:px-24 lg:px-48"
          link={SeeMoreButton()}
        >
          <ContentWheel>{renderLiveries(latest_liveries)}</ContentWheel>
        </ContentWheelContainer>
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
