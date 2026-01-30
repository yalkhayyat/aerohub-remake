import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { authComponent } from "./auth";
import { R2 } from "@convex-dev/r2";
import type { Doc, Id } from "./_generated/dataModel";
import { VEHICLE_DATA } from "../types/vehicle";

// Create R2 client directly to avoid circular dependency
const r2 = new R2(components.r2);

// R2 key prefix for avatar images
const R2_PREFIX = "r2:";

const MAX_TITLE_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 5000;

/**
 * Resolve an avatar image URL.
 * If the image is an R2 key (prefixed with "r2:"), generates a signed URL.
 * Otherwise returns the image as-is (external URLs like Discord avatars).
 */
async function resolveAvatarUrl(
  image: string | null | undefined,
): Promise<string | null> {
  if (!image) return null;

  // External URL (e.g., Discord avatar) - use directly
  if (!image.startsWith(R2_PREFIX)) {
    return image;
  }

  // R2 key - generate signed URL
  const storageKey = image.slice(R2_PREFIX.length);
  try {
    return await r2.getUrl(storageKey, { expiresIn: 60 * 60 * 24 }); // 24 hours
  } catch {
    return null;
  }
}

// Type for livery input
const liveryValidator = v.object({
  keyValues: v.array(
    v.object({
      key: v.string(),
      value: v.string(), // String to support large IDs
    }),
  ),
  title: v.optional(v.string()),
  advancedCustomization: v.optional(v.string()),
});

// Sort options type
type SortOption = "popular" | "latest" | "most-liked";

// Create a new post with liveries
export const createPost = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    vehicles: v.array(v.string()),
    imageKeys: v.array(v.string()), // R2 object keys from client upload
    liveries: v.array(liveryValidator),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("You must be logged in to create a post");
    }

    // Input validation (security fix)
    if (args.title.length > MAX_TITLE_LENGTH) {
      throw new Error(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
    }
    if (args.description && args.description.length > MAX_DESCRIPTION_LENGTH) {
      throw new Error(
        `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`,
      );
    }

    // Validate at least one livery
    if (args.liveries.length === 0) {
      throw new Error("At least one livery is required");
    }

    // Validate image count (1-12)
    if (args.imageKeys.length < 1 || args.imageKeys.length > 12) {
      throw new Error("Posts must have between 1 and 12 images");
    }

    // Determine vehicle types
    const vehicleTypes = new Set<string>();
    for (const vehicle of args.vehicles) {
      const type = VEHICLE_DATA[vehicle as keyof typeof VEHICLE_DATA];
      if (!type) {
        throw new Error(`Invalid vehicle: ${vehicle}`);
      }
      vehicleTypes.add(type);
    }
    const vehicleTypesArray = Array.from(vehicleTypes);
    const tags = [...vehicleTypesArray];

    const now = Date.now();

    // Create the post
    const postId = await ctx.db.insert("posts", {
      title: args.title,
      description: args.description,
      vehicles: args.vehicles,
      vehicleTypes: vehicleTypesArray,
      tags,
      imageKeys: args.imageKeys,
      authorId: user._id,
      createdAt: now,
      updatedAt: now,
      likeCount: 0,
      favoriteCount: 0,
      liveryCount: args.liveries.length,
    });

    // Create associated liveries
    for (const livery of args.liveries) {
      await ctx.db.insert("liveries", {
        postId,
        title: livery.title,
        keyValues: livery.keyValues,
        advancedCustomization: livery.advancedCustomization,
      });
    }

    return postId;
  },
});

// Get a single post by ID with liveries and image URLs
export const getPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      return null;
    }

    // Get liveries for this post
    const liveries = await ctx.db
      .query("liveries")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    // Get author info
    let author: { displayName: string; image: string | null } = {
      displayName: "Unknown User",
      image: null,
    };
    try {
      if (post.authorId) {
        // Use the Better Auth component API to get the user
        const user = await authComponent.getAnyUserById(
          ctx,
          post.authorId as Parameters<typeof authComponent.getAnyUserById>[1],
        );
        if (user) {
          // Resolve avatar URL from R2 key if needed
          const resolvedImage = await resolveAvatarUrl(user.image);
          author = {
            displayName: user.displayUsername || user.name || "User",
            image: resolvedImage,
          };
        }
      }
    } catch (e) {
      console.warn("Failed to fetch author:", e);
      // Keep default
    }

    // Generate signed URLs for images
    const imageUrls = await Promise.all(
      post.imageKeys.map(
        (key) => r2.getUrl(key, { expiresIn: 60 * 60 * 24 }), // 24 hour expiry
      ),
    );

    // Check if current user has liked/favorited
    let isLiked = false;
    let isFavorited = false;

    try {
      const user = await authComponent.getAuthUser(ctx);
      if (user) {
        const like = await ctx.db
          .query("likes")
          .withIndex("by_user_post", (q) =>
            q.eq("userId", user._id).eq("postId", args.postId),
          )
          .first();
        isLiked = !!like;

        const favorite = await ctx.db
          .query("favorites")
          .withIndex("by_user_post", (q) =>
            q.eq("userId", user._id).eq("postId", args.postId),
          )
          .first();
        isFavorited = !!favorite;
      }
    } catch (e) {
      // Auth session expired or invalid - treat as logged out
      console.warn("Auth check failed in getPost:", e);
      isLiked = false;
      isFavorited = false;
    }

    return {
      ...post,
      liveries,
      imageUrls,
      isLiked,
      isFavorited,
      author,
    };
  },
});

// Helper to add thumbnail URL to post
async function addThumbnailUrl(post: Doc<"posts">) {
  return {
    ...post,
    thumbnailUrl:
      post.imageKeys.length > 0
        ? await r2.getUrl(post.imageKeys[0], { expiresIn: 60 * 60 })
        : null,
  };
}

// Browse liveries with filters, sort, and pagination
export const browseLiveries = query({
  args: {
    search: v.optional(v.string()),
    vehicleTypes: v.optional(v.array(v.string())),
    sort: v.optional(
      v.union(
        v.literal("popular"),
        v.literal("latest"),
        v.literal("most-liked"),
      ),
    ),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    authorId: v.optional(v.string()),
    favoritesUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Cap limit to prevent unbounded queries (security fix)
    const limit = Math.min(args.limit ?? 12, 100);
    const sort = args.sort ?? "popular";
    // Max items to fetch before filtering (to prevent memory issues)
    const QUERY_LIMIT = 500;

    // Initial fetch of posts based on context
    let posts: Doc<"posts">[];

    if (args.authorId) {
      // Fetch posts by author (limited)
      posts = await ctx.db
        .query("posts")
        .withIndex("by_author", (q) => q.eq("authorId", args.authorId!))
        .take(QUERY_LIMIT);
    } else if (args.favoritesUserId) {
      // Fetch posts favorited by user
      const favorites = await ctx.db
        .query("favorites")
        .withIndex("by_user", (q) => q.eq("userId", args.favoritesUserId!))
        .take(QUERY_LIMIT);

      const postsOrNull = await Promise.all(
        favorites.map((fav) => ctx.db.get(fav.postId)),
      );

      posts = postsOrNull.filter((p): p is Doc<"posts"> => p !== null);
    } else {
      // Browse all posts (limited to prevent memory issues)
      if (sort === "latest") {
        posts = await ctx.db
          .query("posts")
          .withIndex("by_created")
          .order("desc")
          .take(QUERY_LIMIT);
      } else if (sort === "most-liked") {
        posts = await ctx.db
          .query("posts")
          .withIndex("by_likes")
          .order("desc")
          .take(QUERY_LIMIT);
      } else {
        // popular
        posts = await ctx.db.query("posts").take(QUERY_LIMIT);
      }
    }

    // Apply sorting if not already handled by index (author/favorites source)
    if (args.authorId || args.favoritesUserId || sort === "popular") {
      if (sort === "latest") {
        posts.sort((a, b) => b.createdAt - a.createdAt);
      } else if (sort === "most-liked") {
        posts.sort((a, b) => b.likeCount - a.likeCount);
      } else {
        // popular
        posts.sort(
          (a, b) =>
            b.likeCount + b.favoriteCount - (a.likeCount + a.favoriteCount),
        );
      }
    }

    // Apply filters in memory
    let filteredPosts = posts;

    // Vehicle type filter
    if (args.vehicleTypes && args.vehicleTypes.length > 0) {
      filteredPosts = filteredPosts.filter((p) =>
        p.vehicleTypes.some((t) => args.vehicleTypes!.includes(t)),
      );
    }

    // Search filter
    if (args.search && args.search.trim()) {
      const searchLower = args.search.toLowerCase();
      filteredPosts = filteredPosts.filter((p) => {
        const title = p.title.toLowerCase();
        const description = p.description ? p.description.toLowerCase() : "";

        const matchesSearch =
          title.includes(searchLower) ||
          description.includes(searchLower) ||
          (p.vehicles &&
            p.vehicles.some((v) => v.toLowerCase().includes(searchLower))) ||
          (p.vehicle && p.vehicle.toLowerCase().includes(searchLower)) ||
          (p.vehicleTypes &&
            p.vehicleTypes.some((t) =>
              t.toLowerCase().includes(searchLower),
            )) ||
          (p.vehicleType && p.vehicleType.toLowerCase().includes(searchLower));
        return matchesSearch;
      });
    }

    // Pagination
    const startIndex = args.cursor ? parseInt(args.cursor, 10) : 0;
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < filteredPosts.length;
    const nextCursor = hasMore ? String(startIndex + limit) : null;

    // Add thumbnail URLs and author info
    const postsWithThumbnailsAndAuthors = await Promise.all(
      paginatedPosts.map(async (post) => {
        // Fetch author info
        let authorName = "User";
        try {
          if (post.authorId) {
            const user = await authComponent.getAnyUserById(
              ctx,
              post.authorId as Parameters<
                typeof authComponent.getAnyUserById
              >[1],
            );
            if (user) {
              authorName = user.displayUsername || user.name || "User";
            }
          }
        } catch {
          // Keep default
        }

        return {
          ...post,
          thumbnailUrl:
            post.imageKeys.length > 0
              ? await r2.getUrl(post.imageKeys[0], { expiresIn: 60 * 60 })
              : null,
          authorName,
        };
      }),
    );

    return {
      posts: postsWithThumbnailsAndAuthors,
      hasMore,
      nextCursor,
      totalCount: filteredPosts.length,
    };
  },
});

// List posts with pagination (for latest)
export const listPosts = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    let postsQuery = ctx.db
      .query("posts")
      .withIndex("by_created")
      .order("desc");

    const posts = await postsQuery.take(limit + 1);

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;

    // Get first image URL for each post (thumbnail)
    const postsWithThumbnails = await Promise.all(items.map(addThumbnailUrl));

    return {
      posts: postsWithThumbnails,
      hasMore,
    };
  },
});

// List posts by vehicle
// List posts by vehicle (searches both legacy and new fields)
export const listPostsByVehicle = query({
  args: {
    vehicle: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Search legacy field
    const legacyPosts = await ctx.db
      .query("posts")
      .withIndex("by_vehicle", (q) => q.eq("vehicle", args.vehicle))
      .take(limit);

    // Search new field
    const newPosts = await ctx.db
      .query("posts")
      .withIndex("by_vehicles", (q) => q.eq("vehicles", args.vehicle as any))
      .take(limit);

    // Combine and deduplicate
    const allPosts = [...newPosts, ...legacyPosts].filter(
      (post, index, self) =>
        index === self.findIndex((p) => p._id === post._id),
    );

    // Sort by creation time desc (newest first)
    allPosts.sort((a, b) => b._creationTime - a._creationTime);

    const postsWithThumbnails = await Promise.all(
      allPosts.slice(0, limit).map(addThumbnailUrl),
    );

    return postsWithThumbnails;
  },
});

// List posts by author
export const listPostsByAuthor = query({
  args: {
    authorId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
      .take(limit);

    const postsWithThumbnails = await Promise.all(posts.map(addThumbnailUrl));

    return postsWithThumbnails;
  },
});

// Update a post (author only)
export const updatePost = mutation({
  args: {
    postId: v.id("posts"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    vehicles: v.optional(v.array(v.string())),
    imageKeys: v.optional(v.array(v.string())),
    liveries: v.optional(v.array(liveryValidator)),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("You must be logged in to update a post");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.authorId !== user._id) {
      throw new Error("You can only update your own posts");
    }

    // Input validation (security fix)
    if (args.title !== undefined && args.title.length > MAX_TITLE_LENGTH) {
      throw new Error(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
    }
    if (
      args.description !== undefined &&
      args.description.length > MAX_DESCRIPTION_LENGTH
    ) {
      throw new Error(
        `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`,
      );
    }

    const updates: Partial<Doc<"posts">> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.imageKeys !== undefined) updates.imageKeys = args.imageKeys;

    if (args.vehicles !== undefined) {
      if (args.vehicles.length === 0) {
        throw new Error("At least one vehicle is required");
      }
      updates.vehicles = args.vehicles;

      const vehicleTypes = new Set<string>();
      for (const vehicle of args.vehicles) {
        const type = VEHICLE_DATA[vehicle as keyof typeof VEHICLE_DATA];
        if (!type) {
          throw new Error(`Invalid vehicle: ${vehicle}`);
        }
        vehicleTypes.add(type);
      }
      const vehicleTypesArray = Array.from(vehicleTypes);
      updates.vehicleTypes = vehicleTypesArray;
      updates.tags = [...vehicleTypesArray];
    }

    if (args.liveries !== undefined) {
      // Update liveries: delete old ones and insert new ones
      const oldLiveries = await ctx.db
        .query("liveries")
        .withIndex("by_post", (q) => q.eq("postId", args.postId))
        .collect();

      for (const livery of oldLiveries) {
        await ctx.db.delete(livery._id);
      }

      for (const livery of args.liveries) {
        await ctx.db.insert("liveries", {
          postId: args.postId,
          title: livery.title,
          keyValues: livery.keyValues,
          advancedCustomization: livery.advancedCustomization,
        });
      }

      updates.liveryCount = args.liveries.length;
    }

    await ctx.db.patch(args.postId, updates);

    return args.postId;
  },
});

// Delete a post (author only)
export const deletePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("You must be logged in to delete a post");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.authorId !== user._id) {
      throw new Error("You can only delete your own posts");
    }

    // Store image keys for R2 cleanup
    const imageKeysToDelete = [...post.imageKeys];

    // Delete associated liveries
    const liveries = await ctx.db
      .query("liveries")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    for (const livery of liveries) {
      await ctx.db.delete(livery._id);
    }

    // Delete associated likes
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // Delete associated favorites
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    for (const favorite of favorites) {
      await ctx.db.delete(favorite._id);
    }

    // Delete the post
    await ctx.db.delete(args.postId);

    // Return imageKeys so caller can clean up R2 files
    // The caller should call r2.deleteFile for each key
    return { postId: args.postId, imageKeysToDelete };
  },
});

// List popular posts (sorted by likeCount)
export const listPopular = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_likes")
      .order("desc")
      .take(limit);

    // Get first image URL for each post (thumbnail)
    const postsWithThumbnails = await Promise.all(posts.map(addThumbnailUrl));

    return postsWithThumbnails;
  },
});
