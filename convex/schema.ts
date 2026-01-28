import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  // Posts table - stores user-created posts
  posts: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    vehicle: v.string(), // Vehicle name from types/vehicle.ts
    vehicleType: v.string(), // Vehicle type (e.g., "Jet", "Helicopter")
    tags: v.array(v.string()), // Tags related to the post
    imageKeys: v.array(v.string()), // R2 object keys
    authorId: v.string(), // User ID from auth
    createdAt: v.number(), // Timestamp
    updatedAt: v.number(),
    likeCount: v.number(), // Denormalized for performance
    favoriteCount: v.number(), // Denormalized for performance
    liveryCount: v.number(), // Number of liveries in this pack (denormalized)
  })
    .index("by_author", ["authorId"])
    .index("by_vehicle", ["vehicle"])
    .index("by_vehicleType", ["vehicleType"])
    .index("by_tags", ["tags"])
    .index("by_created", ["createdAt"])
    .index("by_likes", ["likeCount"]),

  // Liveries table - one-to-many with posts
  liveries: defineTable({
    postId: v.id("posts"),
    keyValues: v.array(
      v.object({
        key: v.string(), // e.g., "Body", "Wings"
        value: v.string(), // String ID (e.g., "130918554061368")
      }),
    ),
    title: v.optional(v.string()), // Customizable name
    advancedCustomization: v.optional(v.string()), // JSON string
  }).index("by_post", ["postId"]),

  // Likes table - many-to-many: users <-> posts
  likes: defineTable({
    userId: v.string(),
    postId: v.id("posts"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_post", ["postId"])
    .index("by_user_post", ["userId", "postId"]),

  // Favorites table - many-to-many: users <-> posts
  favorites: defineTable({
    userId: v.string(),
    postId: v.id("posts"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_post", ["postId"])
    .index("by_user_post", ["userId", "postId"]),
});

export default schema;
