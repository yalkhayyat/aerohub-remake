import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { authComponent } from "./auth";
import { R2 } from "@convex-dev/r2";
import type { Doc, Id } from "./_generated/dataModel";
import { VEHICLE_DATA } from "../types/vehicle";

// Create R2 client directly to avoid circular dependency
const r2 = new R2(components.r2);

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
    vehicle: v.string(),
    imageKeys: v.array(v.string()), // R2 object keys from client upload
    liveries: v.array(liveryValidator),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("You must be logged in to create a post");
    }

    // Validate at least one livery
    if (args.liveries.length === 0) {
      throw new Error("At least one livery is required");
    }

    // Validate image count (1-12)
    if (args.imageKeys.length < 1 || args.imageKeys.length > 12) {
      throw new Error("Posts must have between 1 and 12 images");
    }

    // Determine vehicle type
    const vehicleType = VEHICLE_DATA[args.vehicle as keyof typeof VEHICLE_DATA];
    if (!vehicleType) {
      throw new Error(`Invalid vehicle: ${args.vehicle}`);
    }

    const tags = [vehicleType];

    const now = Date.now();

    // Create the post
    const postId = await ctx.db.insert("posts", {
      title: args.title,
      description: args.description,
      vehicle: args.vehicle,
      vehicleType,
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
      // Check if authorId is a valid ID string (basic check)
      // Convex IDs are base32 strings
      if (post.authorId && !post.authorId.startsWith("mock-user")) {
        // Use the Better Auth component API to get the user
        const user = await authComponent.getAnyUserById(
          ctx,
          post.authorId as any,
        );
        if (user) {
          author = {
            displayName: user.displayUsername || user.name || "User",
            image: user.image || null,
          };
        }
      } else {
        // Handle mock users or fallback
        if (post.authorId.startsWith("mock-user")) {
          author = {
            displayName: "Pilot " + post.authorId.split("-")[2],
            image: null,
          };
        }
      }
    } catch (e) {
      console.error("Failed to fetch author:", e);
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
    } catch {
      // Auth session expired or invalid - treat as logged out
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
    const limit = args.limit ?? 12;
    const sort = args.sort ?? "popular";

    // Initial fetch of posts based on context
    let posts: Doc<"posts">[];

    if (args.authorId) {
      // Fetch posts by author
      posts = await ctx.db
        .query("posts")
        .withIndex("by_author", (q) => q.eq("authorId", args.authorId!))
        .collect();
    } else if (args.favoritesUserId) {
      // Fetch posts favorited by user
      const favorites = await ctx.db
        .query("favorites")
        .withIndex("by_user", (q) => q.eq("userId", args.favoritesUserId!))
        .collect();

      const postsOrNull = await Promise.all(
        favorites.map((fav) => ctx.db.get(fav.postId)),
      );

      posts = postsOrNull.filter((p): p is Doc<"posts"> => p !== null);
    } else {
      // Browse all posts
      if (sort === "latest") {
        posts = await ctx.db
          .query("posts")
          .withIndex("by_created")
          .order("desc")
          .collect();
      } else if (sort === "most-liked") {
        posts = await ctx.db
          .query("posts")
          .withIndex("by_likes")
          .order("desc")
          .collect();
      } else {
        // popular
        posts = await ctx.db.query("posts").collect();
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
        args.vehicleTypes!.includes(p.vehicleType),
      );
    }

    // Search filter
    if (args.search && args.search.trim()) {
      const searchLower = args.search.toLowerCase();
      filteredPosts = filteredPosts.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          p.vehicle.toLowerCase().includes(searchLower) ||
          p.vehicleType.toLowerCase().includes(searchLower) ||
          (p.description && p.description.toLowerCase().includes(searchLower)),
      );
    }

    // Pagination
    const startIndex = args.cursor ? parseInt(args.cursor, 10) : 0;
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < filteredPosts.length;
    const nextCursor = hasMore ? String(startIndex + limit) : null;

    // Add thumbnail URLs
    const postsWithThumbnails = await Promise.all(
      paginatedPosts.map(addThumbnailUrl),
    );

    return {
      posts: postsWithThumbnails,
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
export const listPostsByVehicle = query({
  args: {
    vehicle: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_vehicle", (q) => q.eq("vehicle", args.vehicle))
      .take(limit);

    const postsWithThumbnails = await Promise.all(posts.map(addThumbnailUrl));

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
    vehicle: v.optional(v.string()),
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

    const updates: Partial<Doc<"posts">> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.imageKeys !== undefined) updates.imageKeys = args.imageKeys;

    if (args.vehicle !== undefined) {
      updates.vehicle = args.vehicle;
      const vehicleType =
        VEHICLE_DATA[args.vehicle as keyof typeof VEHICLE_DATA];
      if (!vehicleType) {
        throw new Error(`Invalid vehicle: ${args.vehicle}`);
      }
      updates.vehicleType = vehicleType;
      updates.tags = [vehicleType];
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

    // Note: R2 files should be cleaned up separately if needed
    // For now we'll leave orphaned files in R2

    return args.postId;
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
