"use client";

import { VEHICLE_DATA } from "@/types/vehicle";

// Get unique vehicle types
const VEHICLE_TYPES = [...new Set(Object.values(VEHICLE_DATA))] as string[];

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

// Get random vehicles from the vehicle data
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
  const prefixes = [
    "Pilot",
    "Captain",
    "Avi",
    "Sky",
    "Aero",
    "Flight",
    "Wing",
    "Jet",
  ];
  const suffixes = [
    "Master",
    "Pro",
    "Fan",
    "Lover",
    "Expert",
    "Guy",
    "King",
    "Lord",
  ];
  const numbers = ["", "99", "23", "X", "007", "42", "_YT"];
  return (
    prefixes[Math.floor(Math.random() * prefixes.length)] +
    suffixes[Math.floor(Math.random() * suffixes.length)] +
    numbers[Math.floor(Math.random() * numbers.length)]
  );
}

// Livery variation within a pack
export interface LiveryVariation {
  id: string;
  title: string; // e.g., "N12345 - Delta Airlines"
  thumbnailUrl: string;
}

export interface MockLivery {
  id: string;
  title: string;
  description: string;
  vehicle: string;
  vehicleType: string;
  tags: string[];
  thumbnailUrl: string; // Primary thumbnail
  thumbnailUrls: string[]; // All thumbnails for carousel
  username: string;
  createdAt: number;
  likeCount: number;
  favoriteCount: number;
  // Pack-related
  liveryCount: number; // How many liveries in this pack
  variations: LiveryVariation[]; // Individual variations
}

// Generate mock liveries with pack support
function generateMockLiveries(count: number): MockLivery[] {
  const liveries: MockLivery[] = [];

  for (let i = 0; i < count; i++) {
    const vehicle = getRandomVehicle();
    const titleIndex = i % LIVERY_TITLES.length;
    const baseSeed = i + 100;

    // Randomly make some posts into packs (30% chance, 2-6 liveries)
    const isPack = Math.random() < 0.3;
    const liveryCount = isPack ? Math.floor(Math.random() * 5) + 2 : 1;

    // Generate thumbnail URLs for each livery in the pack
    const thumbnailUrls = Array.from(
      { length: liveryCount },
      (_, j) => `https://picsum.photos/seed/${baseSeed + j}/800/600`,
    );

    // Generate variations for packs
    const variations: LiveryVariation[] = thumbnailUrls.map((url, j) => ({
      id: `mock-${i + 1}-var-${j + 1}`,
      title: isPack
        ? `${VARIATION_NAMES[j % VARIATION_NAMES.length]} - ${LIVERY_TITLES[titleIndex]}`
        : LIVERY_TITLES[titleIndex],
      thumbnailUrl: url,
    }));

    liveries.push({
      id: `mock-${i + 1}`,
      title: isPack
        ? `${LIVERY_TITLES[titleIndex]} Pack`
        : LIVERY_TITLES[titleIndex],
      description: `A stunning ${vehicle.type.toLowerCase()} livery featuring the iconic ${LIVERY_TITLES[titleIndex]} design. Perfect for aviation enthusiasts who appreciate attention to detail.`,
      vehicle: vehicle.name,
      vehicleType: vehicle.type,
      tags: [vehicle.type, "Custom", i % 3 === 0 ? "Popular" : "New"],
      thumbnailUrl: thumbnailUrls[0],
      thumbnailUrls,
      username: getRandomUsername(),
      createdAt: getRandomDate(),
      likeCount: Math.floor(Math.random() * 500),
      favoriteCount: Math.floor(Math.random() * 100),
      liveryCount,
      variations,
    });
  }

  return liveries;
}

// Export 50 mock liveries
export const MOCK_LIVERIES = generateMockLiveries(50);

// Export vehicle types for filters
export const FILTER_VEHICLE_TYPES = VEHICLE_TYPES;

// Sort options
export type SortOption = "popular" | "latest" | "most-liked";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "popular", label: "Most Popular" },
  { value: "latest", label: "Latest" },
  { value: "most-liked", label: "Most Liked" },
];

// Filter and sort liveries
export function filterAndSortLiveries(
  liveries: MockLivery[],
  filters: {
    search?: string;
    vehicleTypes?: string[];
    sort?: SortOption;
  },
): MockLivery[] {
  let result = [...liveries];

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(
      (l) =>
        l.title.toLowerCase().includes(searchLower) ||
        l.vehicle.toLowerCase().includes(searchLower) ||
        l.vehicleType.toLowerCase().includes(searchLower) ||
        l.description.toLowerCase().includes(searchLower),
    );
  }

  // Vehicle type filter
  if (filters.vehicleTypes && filters.vehicleTypes.length > 0) {
    result = result.filter((l) =>
      filters.vehicleTypes!.includes(l.vehicleType),
    );
  }

  // Sort
  switch (filters.sort) {
    case "latest":
      result.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case "most-liked":
      result.sort((a, b) => b.likeCount - a.likeCount);
      break;
    case "popular":
    default:
      result.sort(
        (a, b) =>
          b.likeCount + b.favoriteCount - (a.likeCount + a.favoriteCount),
      );
      break;
  }

  return result;
}
