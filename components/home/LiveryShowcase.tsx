"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CarouselItem } from "@/components/ui/carousel";
import { LiveryCardEnhanced } from "@/components/liveries";
import ContentWheelContainer from "@/app/ui/content-wheel-container";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ContentWheel } from "@/app/ui/content-wheel";
import Link from "next/link";

function SeeMoreButton() {
  return (
    <Button variant="link" className="ml-auto" asChild>
      <Link href="/liveries">
        See more
        <ArrowRight />
      </Link>
    </Button>
  );
}

// Loading skeleton for carousels
function CarouselSkeleton() {
  return <div className="h-64 bg-slate-800/20 animate-pulse rounded-lg m-4" />;
}

export function FeaturedLiveries() {
  // For now, using popular as featured
  const result = useQuery(api.posts.browseLiveries, {
    sort: "popular",
    limit: 10,
  });
  const posts = result?.posts;

  if (!posts) {
    return <CarouselSkeleton />;
  }

  if (posts.length === 0) {
    return null;
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
            <Link href={`/liveries/${post._id}`}>
              <LiveryCardEnhanced
                id={post._id}
                title={post.title}
                description={post.description || ""}
                vehicles={post.vehicles || (post.vehicle ? [post.vehicle] : [])}
                vehicleTypes={
                  post.vehicleTypes ||
                  (post.vehicleType ? [post.vehicleType] : [])
                }
                thumbnailUrl={post.thumbnailUrl || ""}
                username="User" // TODO: Fetch actual username
                createdAt={post._creationTime}
                likeCount={post.likeCount}
                favoriteCount={post.favoriteCount}
                liveryCount={post.liveryCount}
              />
            </Link>
          </CarouselItem>
        ))}
      </ContentWheel>
    </ContentWheelContainer>
  );
}

export function PopularLiveries() {
  const result = useQuery(api.posts.browseLiveries, {
    sort: "most-liked",
    limit: 10,
  });
  const posts = result?.posts;

  if (!posts) {
    return <CarouselSkeleton />;
  }

  if (posts.length === 0) {
    return null;
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
            <Link href={`/liveries/${post._id}`}>
              <LiveryCardEnhanced
                id={post._id}
                title={post.title}
                description={post.description || ""}
                vehicles={post.vehicles || (post.vehicle ? [post.vehicle] : [])}
                vehicleTypes={
                  post.vehicleTypes ||
                  (post.vehicleType ? [post.vehicleType] : [])
                }
                thumbnailUrl={post.thumbnailUrl || ""}
                username="User"
                createdAt={post._creationTime}
                likeCount={post.likeCount}
                favoriteCount={post.favoriteCount}
                liveryCount={post.liveryCount}
              />
            </Link>
          </CarouselItem>
        ))}
      </ContentWheel>
    </ContentWheelContainer>
  );
}

export function LatestLiveries() {
  const result = useQuery(api.posts.browseLiveries, {
    sort: "latest",
    limit: 10,
  });
  const posts = result?.posts;

  if (!posts) {
    return <CarouselSkeleton />;
  }

  if (posts.length === 0) {
    return null;
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
            <Link href={`/liveries/${post._id}`}>
              <LiveryCardEnhanced
                id={post._id}
                title={post.title}
                description={post.description || ""}
                vehicles={post.vehicles || (post.vehicle ? [post.vehicle] : [])}
                vehicleTypes={
                  post.vehicleTypes ||
                  (post.vehicleType ? [post.vehicleType] : [])
                }
                thumbnailUrl={post.thumbnailUrl || ""}
                username="User"
                createdAt={post._creationTime}
                likeCount={post.likeCount}
                favoriteCount={post.favoriteCount}
                liveryCount={post.liveryCount}
              />
            </Link>
          </CarouselItem>
        ))}
      </ContentWheel>
    </ContentWheelContainer>
  );
}
