import type { Id, Doc } from "@/convex/_generated/dataModel";
import type { Vehicle } from "./vehicle";

// Livery key-value pair
export interface LiveryKeyValue {
  key: string;
  value: string; // String to support large IDs like 130918554061368
}

// Individual livery
export interface Livery {
  _id: Id<"liveries">;
  postId: Id<"posts">;
  title?: string;
  keyValues: LiveryKeyValue[];
  advancedCustomization?: string;
}

// Livery input for creating posts
export interface LiveryInput {
  title?: string;
  keyValues: LiveryKeyValue[];
  advancedCustomization?: string;
}

// Post document from database
export interface Post {
  _id: Id<"posts">;
  _creationTime: number;
  title: string;
  description?: string;
  vehicle: string;
  imageKeys: string[];
  authorId: string;
  createdAt: number;
  updatedAt: number;
  likeCount: number;
  favoriteCount: number;
}

// Post with resolved image URLs and liveries
export interface PostWithDetails extends Post {
  imageUrls: string[];
  liveries: Livery[];
}

// Post with thumbnail for list views
export interface PostWithThumbnail extends Post {
  thumbnailUrl: string | null;
}

// Create post input
export interface CreatePostInput {
  title: string;
  description?: string;
  vehicle: Vehicle;
  imageKeys: string[];
  liveries: LiveryInput[];
}

// Update post input
export interface UpdatePostInput {
  postId: Id<"posts">;
  title?: string;
  description?: string;
  vehicle?: string;
}
