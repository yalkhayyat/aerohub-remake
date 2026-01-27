import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { authComponent } from "./auth";
import { R2 } from "@convex-dev/r2";
import type { Doc, Id } from "./_generated/dataModel";

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

    const now = Date.now();

    // Create the post
    const postId = await ctx.db.insert("posts", {
      title: args.title,
      description: args.description,
      vehicle: args.vehicle,
      imageKeys: args.imageKeys,
      authorId: user._id,
      createdAt: now,
      updatedAt: now,
      likeCount: 0,
      favoriteCount: 0,
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

    // Generate signed URLs for images
    const imageUrls = await Promise.all(
      post.imageKeys.map(
        (key) => r2.getUrl(key, { expiresIn: 60 * 60 * 24 }), // 24 hour expiry
      ),
    );

    return {
      ...post,
      liveries,
      imageUrls,
    };
  },
});

// List posts with pagination
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
    const postsWithThumbnails = await Promise.all(
      items.map(async (post) => ({
        ...post,
        thumbnailUrl:
          post.imageKeys.length > 0
            ? await r2.getUrl(post.imageKeys[0], { expiresIn: 60 * 60 })
            : null,
      })),
    );

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

    const postsWithThumbnails = await Promise.all(
      posts.map(async (post) => ({
        ...post,
        thumbnailUrl:
          post.imageKeys.length > 0
            ? await r2.getUrl(post.imageKeys[0], { expiresIn: 60 * 60 })
            : null,
      })),
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

    const postsWithThumbnails = await Promise.all(
      posts.map(async (post) => ({
        ...post,
        thumbnailUrl:
          post.imageKeys.length > 0
            ? await r2.getUrl(post.imageKeys[0], { expiresIn: 60 * 60 })
            : null,
      })),
    );

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
    if (args.vehicle !== undefined) updates.vehicle = args.vehicle;

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
    const postsWithThumbnails = await Promise.all(
      posts.map(async (post) => ({
        ...post,
        thumbnailUrl:
          post.imageKeys.length > 0
            ? await r2.getUrl(post.imageKeys[0], { expiresIn: 60 * 60 })
            : null,
      })),
    );

    return postsWithThumbnails;
  },
});
