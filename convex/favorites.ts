import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

// Toggle favorite on a post (add/remove favorite)
export const toggleFavorite = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("You must be logged in to favorite a post");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Check if already favorited
    const existingFavorite = await ctx.db
      .query("favorites")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId),
      )
      .first();

    if (existingFavorite) {
      // Unfavorite: remove the favorite and decrement count
      await ctx.db.delete(existingFavorite._id);
      await ctx.db.patch(args.postId, {
        favoriteCount: Math.max(0, post.favoriteCount - 1),
      });
      return { favorited: false };
    } else {
      // Favorite: add new favorite and increment count
      await ctx.db.insert("favorites", {
        userId: user._id,
        postId: args.postId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.postId, {
        favoriteCount: post.favoriteCount + 1,
      });
      return { favorited: true };
    }
  },
});

// Check if current user has favorited a post
export const isFavorited = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return false;
    }

    const existingFavorite = await ctx.db
      .query("favorites")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId),
      )
      .first();

    return existingFavorite !== null;
  },
});

// Get favorite count for a post
export const getFavoriteCount = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    return post?.favoriteCount ?? 0;
  },
});

// Get all posts favorited by a user
export const getUserFavorites = query({
  args: {
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // If no userId provided, use current user
    let userId = args.userId;
    if (!userId) {
      const user = await authComponent.getAuthUser(ctx);
      if (!user) {
        return [];
      }
      userId = user._id;
    }

    const limit = args.limit ?? 20;

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", userId!))
      .take(limit);

    // Get the associated posts
    const posts = await Promise.all(
      favorites.map(async (favorite) => {
        const post = await ctx.db.get(favorite.postId);
        return post;
      }),
    );

    return posts.filter((post) => post !== null);
  },
});
