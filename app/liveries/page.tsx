"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  LiveriesHero,
  LiveriesFiltersSidebar,
  LiveriesFiltersMobile,
  LiveriesGrid,
  SortTabs,
} from "@/components/liveries";
import { FILTER_VEHICLE_TYPES } from "@/lib/mock-liveries";

// Sort type matching backend
type SortOption = "popular" | "latest" | "most-liked";

// Number of liveries to show per page
const PAGE_SIZE = 12;

// Livery type
interface Livery {
  id: string;
  title: string;
  description: string;
  vehicles: string[];
  vehicleTypes: string[];
  vehicle?: string;
  vehicleType?: string;
  thumbnailUrl: string;
  username: string;
  createdAt: number;
  likeCount: number;
  favoriteCount: number;
  liveryCount: number;
}

export default function LiveriesPage() {
  // State
  const [searchValue, setSearchValue] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [cursor, setCursor] = useState<string | null>(null);
  const [allLiveries, setAllLiveries] = useState<Livery[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedSearch !== searchValue) {
        setDebouncedSearch(searchValue);
        setCursor(null);
        setAllLiveries([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, debouncedSearch]);

  // Reset when filters/sort change
  const handleSortChange = useCallback(
    (newSort: SortOption) => {
      if (newSort !== sortBy) {
        setSortBy(newSort);
        setCursor(null);
        setAllLiveries([]);
      }
    },
    [sortBy],
  );

  const handleTypesChange = useCallback((newTypes: string[]) => {
    setSelectedTypes(newTypes);
    setCursor(null);
    setAllLiveries([]);
  }, []);

  // Fetch data from Convex
  const result = useQuery(api.posts.browseLiveries, {
    search: debouncedSearch || undefined,
    vehicleTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
    sort: sortBy,
    limit: PAGE_SIZE,
    cursor: cursor ?? undefined,
  });

  // Transform posts to liveries format
  const transformPosts = useCallback(
    (posts: NonNullable<typeof result>["posts"]) => {
      return posts.map((post) => ({
        id: post._id,
        title: post.title,
        description: post.description || "",
        vehicles: post.vehicles || (post.vehicle ? [post.vehicle] : []),
        vehicleTypes:
          post.vehicleTypes || (post.vehicleType ? [post.vehicleType] : []),
        thumbnailUrl: post.thumbnailUrl || "",
        username: post.authorName || "User",
        createdAt: post._creationTime, // Changed from post.createdAt to post._creationTime
        likeCount: post.likeCount,
        favoriteCount: post.favoriteCount,
        liveryCount: post.liveryCount,
      }));
    },
    [],
  );

  // Current liveries to display - use result directly if no pagination, otherwise use accumulated
  const displayLiveries =
    cursor === null && result ? transformPosts(result.posts) : allLiveries;

  // Update accumulated liveries when loading more
  useEffect(() => {
    if (result && cursor !== null && isLoadingMore) {
      // Append new results for "load more"
      setAllLiveries((prev) => [...prev, ...transformPosts(result.posts)]);
      setIsLoadingMore(false);
    }
  }, [result, cursor, isLoadingMore, transformPosts]);

  // Sync first page to allLiveries for subsequent pagination
  useEffect(() => {
    if (result && cursor === null) {
      setAllLiveries(transformPosts(result.posts));
    }
  }, [result, cursor, transformPosts]);

  const hasMore = result?.hasMore ?? false;
  const totalCount = result?.totalCount ?? displayLiveries.length;
  const isLoading = result === undefined;

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (result?.nextCursor) {
      setIsLoadingMore(true);
      setCursor(result.nextCursor);
    }
  }, [result?.nextCursor]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <LiveriesHero
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        className="pt-20"
      />

      {/* Sort Tabs + Mobile Filter Button */}
      <div className="px-4 md:px-24 lg:px-48 pb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <SortTabs value={sortBy} onChange={handleSortChange} />

          <LiveriesFiltersMobile
            vehicleTypes={FILTER_VEHICLE_TYPES}
            selectedTypes={selectedTypes}
            onTypesChange={handleTypesChange}
            resultCount={totalCount}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 md:px-24 lg:px-48 pb-16">
        <div className="flex gap-8">
          <LiveriesFiltersSidebar
            vehicleTypes={FILTER_VEHICLE_TYPES}
            selectedTypes={selectedTypes}
            onTypesChange={handleTypesChange}
            resultCount={totalCount}
          />

          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {isLoading ? (
                  "Loading liveries..."
                ) : (
                  <>
                    Showing{" "}
                    <span className="font-medium text-foreground">
                      {displayLiveries.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-foreground">
                      {totalCount}
                    </span>{" "}
                    liveries
                    {selectedTypes.length > 0 && (
                      <span className="text-primary ml-1">
                        ({selectedTypes.join(", ")})
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>

            <LiveriesGrid
              liveries={displayLiveries}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
