"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CarouselItem } from "@/components/ui/carousel";
import LiveryCard from "@/app/ui/livery-card";
import ContentWheelContainer from "@/app/ui/content-wheel-container";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ContentWheel } from "@/app/ui/content-wheel";

function SeeMoreButton() {
  return (
    <Button variant="link" className="ml-auto">
      See more
      <ArrowRight />
    </Button>
  );
}

export function FeaturedLiveries() {
  // For now, using popular as featured
  const posts = useQuery(api.posts.listPopular, { limit: 15 });

  if (!posts) {
    return (
      <div className="h-64 bg-slate-800/20 animate-pulse rounded-lg m-4" />
    );
  }

  return (
    <ContentWheelContainer
      title="Featured"
      description="This week's top picks."
      className="px-4 md:px-24 lg:px-48"
      sectionId="featured"
      link={<SeeMoreButton />}
    >
      <ContentWheel>
        {posts.map((post) => (
          <CarouselItem key={post._id} className="md:basis-1/2 lg:basis-1/3">
            <LiveryCard
              title={post.title}
              description={post.description || ""}
              tag={post.vehicle}
              img={post.thumbnailUrl || ""}
              username={"User"} // TODO: Fetch user name
              created_at={new Date(post._creationTime).toLocaleDateString()}
            />
          </CarouselItem>
        ))}
      </ContentWheel>
    </ContentWheelContainer>
  );
}

export function PopularLiveries() {
  const posts = useQuery(api.posts.listPopular, { limit: 15 });

  if (!posts) {
    return (
      <div className="h-64 bg-slate-800/20 animate-pulse rounded-lg m-4" />
    );
  }

  return (
    <ContentWheelContainer
      title="Most Popular"
      description="Highly rated, consistently downloaded, and loved by the community."
      className="px-4 md:px-24 lg:px-48"
      link={<SeeMoreButton />}
    >
      <ContentWheel>
        {posts.map((post) => (
          <CarouselItem key={post._id} className="md:basis-1/2 lg:basis-1/3">
            <LiveryCard
              title={post.title}
              description={post.description || ""}
              tag={post.vehicle}
              img={post.thumbnailUrl || ""}
              username={"User"} // TODO: Fetch user name
              created_at={new Date(post._creationTime).toLocaleDateString()}
            />
          </CarouselItem>
        ))}
      </ContentWheel>
    </ContentWheelContainer>
  );
}

export function LatestLiveries() {
  const result = useQuery(api.posts.listPosts, { limit: 15 });
  const posts = result?.posts;

  if (!posts) {
    return (
      <div className="h-64 bg-slate-800/20 animate-pulse rounded-lg m-4" />
    );
  }

  return (
    <ContentWheelContainer
      title="Latest"
      description="Discover the newest additions to AEROHUB."
      className="px-4 md:px-24 lg:px-48"
      link={<SeeMoreButton />}
    >
      <ContentWheel>
        {posts.map((post) => (
          <CarouselItem key={post._id} className="md:basis-1/2 lg:basis-1/3">
            <LiveryCard
              title={post.title}
              description={post.description || ""}
              tag={post.vehicle}
              img={post.thumbnailUrl || ""}
              username={"User"} // TODO: Fetch user name
              created_at={new Date(post._creationTime).toLocaleDateString()}
            />
          </CarouselItem>
        ))}
      </ContentWheel>
    </ContentWheelContainer>
  );
}
