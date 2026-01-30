import { mutation } from "./_generated/server";
import { VEHICLE_DATA } from "../types/vehicle";

// Sample livery titles for realism
const LIVERY_TITLES = [
  "Delta Air Lines Classic",
  "British Airways Landor",
  "Lufthansa Retro",
  "Emirates A380 Wildlife",
  "Japan Airlines Tsurumaru",
  "Singapore Airlines Premium",
  "Qatar Airways Oryx",
  "Air France Skyteam",
  "KLM Royal Dutch",
  "American Airlines Chrome",
  "United Battleship Gray",
  "Southwest Heart One",
  "Alaska Airlines Salmon",
  "Hawaiian Airlines Moana",
  "Virgin Atlantic Lady",
  "Qantas Retro Roo",
  "Air New Zealand All Blacks",
  "Cathay Pacific Brushwing",
  "Thai Airways Orchid",
  "Turkish Airlines Star",
  "Iberia New Colors",
  "Aeroflot Skyteam",
  "Korean Air Excellence",
  "China Airlines Dynasty",
  "EVA Air Hello Kitty",
  "ANA Star Wars",
  "Finnair Marimekko",
  "Icelandair Hekla Aurora",
  "Norwegian Tail Heroes",
  "Ryanair Refresh",
];

// Variation names for packs
const VARIATION_NAMES = [
  "N12345",
  "G-BOAC",
  "D-AIXX",
  "JA8089",
  "F-GSTD",
  "VH-OQA",
  "9V-SKA",
  "HL7614",
  "B-18901",
  "A6-EDA",
];

// Mock usernames
const USERNAMES = [
  "PilotMaster",
  "CaptainPro",
  "AviFan",
  "SkyLover",
  "AeroExpert",
  "FlightGuy",
  "WingKing",
  "JetLord",
  "AviatorX",
  "SkyPilot99",
];

// Get vehicle names from VEHICLE_DATA
const vehicleNames = Object.keys(VEHICLE_DATA);

function getRandomVehicle(): { name: string; type: string } {
  const name = vehicleNames[Math.floor(Math.random() * vehicleNames.length)];
  return {
    name,
    type: VEHICLE_DATA[name as keyof typeof VEHICLE_DATA],
  };
}

function getRandomDate(): number {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  return Math.floor(thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo));
}

function getRandomUsername(): string {
  return USERNAMES[Math.floor(Math.random() * USERNAMES.length)];
}

// Seed the database with mock posts and liveries
export const seedPosts = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if we already have posts
    const existingPosts = await ctx.db.query("posts").take(1);
    if (existingPosts.length > 0) {
      console.log("Database already has posts, skipping seed");
      return { seeded: false, message: "Database already has posts" };
    }

    const createdPosts: string[] = [];

    for (let i = 0; i < 50; i++) {
      const vehicle = getRandomVehicle();
      const titleIndex = i % LIVERY_TITLES.length;
      const createdAt = getRandomDate();

      // Randomly make some posts into packs (30% chance, 2-6 liveries)
      const isPack = Math.random() < 0.3;
      const liveryCount = isPack ? Math.floor(Math.random() * 5) + 2 : 1;

      // Create the post
      const postId = await ctx.db.insert("posts", {
        title: isPack
          ? `${LIVERY_TITLES[titleIndex]} Pack`
          : LIVERY_TITLES[titleIndex],
        description: `A stunning ${vehicle.type.toLowerCase()} livery featuring the iconic ${LIVERY_TITLES[titleIndex]} design. Perfect for aviation enthusiasts who appreciate attention to detail.`,
        vehicle: vehicle.name,
        vehicleType: vehicle.type,
        vehicles: [vehicle.name],
        vehicleTypes: [vehicle.type],
        tags: [vehicle.type, "Custom", i % 3 === 0 ? "Popular" : "New"],
        imageKeys: [`mock-image-${i + 1}`], // Placeholder - no actual R2 images
        authorId: `mock-user-${(i % 10) + 1}`, // Mock author IDs
        createdAt,
        updatedAt: createdAt,
        likeCount: Math.floor(Math.random() * 500),
        favoriteCount: Math.floor(Math.random() * 100),
        liveryCount,
      });

      // Create associated liveries
      for (let j = 0; j < liveryCount; j++) {
        await ctx.db.insert("liveries", {
          postId,
          title: isPack
            ? `${VARIATION_NAMES[j % VARIATION_NAMES.length]} - ${LIVERY_TITLES[titleIndex]}`
            : LIVERY_TITLES[titleIndex],
          keyValues: [
            {
              key: "Body",
              value: String(Math.floor(Math.random() * 1000000000000)),
            },
            {
              key: "Wings",
              value: String(Math.floor(Math.random() * 1000000000000)),
            },
            {
              key: "Tail",
              value: String(Math.floor(Math.random() * 1000000000000)),
            },
          ],
        });
      }

      createdPosts.push(postId);
    }

    console.log(`Seeded ${createdPosts.length} posts`);
    return { seeded: true, count: createdPosts.length };
  },
});

// Clear all posts and liveries (for development)
export const clearPosts = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all liveries
    const liveries = await ctx.db.query("liveries").collect();
    for (const livery of liveries) {
      await ctx.db.delete(livery._id);
    }

    // Delete all likes
    const likes = await ctx.db.query("likes").collect();
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // Delete all favorites
    const favorites = await ctx.db.query("favorites").collect();
    for (const favorite of favorites) {
      await ctx.db.delete(favorite._id);
    }

    // Delete all posts
    const posts = await ctx.db.query("posts").collect();
    for (const post of posts) {
      await ctx.db.delete(post._id);
    }

    return {
      cleared: true,
      counts: {
        posts: posts.length,
        liveries: liveries.length,
        likes: likes.length,
        favorites: favorites.length,
      },
    };
  },
});
