import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

// Toggle like on a post (like/unlike)
export const toggleLike = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("You must be logged in to like a post");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Check if already liked
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId),
      )
      .first();

    if (existingLike) {
      // Unlike: remove the like and decrement count
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.postId, {
        likeCount: Math.max(0, post.likeCount - 1),
      });
      return { liked: false };
    } else {
      // Like: add new like and increment count
      await ctx.db.insert("likes", {
        userId: user._id,
        postId: args.postId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.postId, {
        likeCount: post.likeCount + 1,
      });
      return { liked: true };
    }
  },
});

// Check if current user has liked a post
export const isLiked = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    let user = null;
    try {
      user = await authComponent.getAuthUser(ctx);
    } catch {
      return false;
    }
    if (!user) {
      return false;
    }

    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId),
      )
      .first();

    return existingLike !== null;
  },
});

// Get like count for a post
export const getLikeCount = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    return post?.likeCount ?? 0;
  },
});

// Get all posts liked by a user
export const getUserLikes = query({
  args: {
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // If no userId provided, use current user
    let userId = args.userId;
    if (!userId) {
      let user = null;
      try {
        user = await authComponent.getAuthUser(ctx);
      } catch {
        return [];
      }
      if (!user) {
        return [];
      }
      userId = user._id;
    }

    const limit = args.limit ?? 20;

    const likes = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", userId!))
      .take(limit);

    // Get the associated posts
    const posts = await Promise.all(
      likes.map(async (like) => {
        const post = await ctx.db.get(like.postId);
        return post;
      }),
    );

    return posts.filter((post) => post !== null);
  },
});
