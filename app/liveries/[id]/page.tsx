import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { LiveryDetailView } from "@/components/liveries/livery-detail-view";
import type { Id } from "@/convex/_generated/dataModel";

type Props = {
  params: Promise<{ id: string }>;
};

// Helper to truncate description for meta tags
function truncate(str: string, length: number) {
  if (!str) return "";
  return str.length > length ? str.substring(0, length) + "..." : str;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  // Basic validation for Convex ID format
  const isValidId = id && /^[a-zA-Z0-9_-]{5,}$/.test(id);

  if (!isValidId) {
    return {
      title: "Livery Not Found | AEROHUB",
    };
  }

  try {
    const post = await fetchQuery(api.posts.getPost, {
      postId: id as Id<"posts">,
    });

    if (!post) {
      return {
        title: "Livery Not Found | AEROHUB",
      };
    }

    const title = post.title;
    const description = truncate(
      post.description || "View this livery on AEROHUB",
      160,
    );
    // Use the first image as the cover photo
    const image = post.imageUrls?.[0];

    return {
      title: `${title} | AEROHUB`,
      description,
      openGraph: {
        title,
        description,
        images: image ? [image] : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: image ? [image] : [],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Livery | AEROHUB",
    };
  }
}

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <LiveryDetailView postId={id} />;
}
