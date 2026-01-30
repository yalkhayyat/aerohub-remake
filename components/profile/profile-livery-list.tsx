"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  LiveriesFiltersSidebar,
  LiveriesFiltersMobile,
  LiveriesGrid,
  SortTabs,
  LiveriesSearch,
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

interface ProfileLiveryListProps {
  authorId?: string;
  favoritesUserId?: string;
  emptyMessage?: string;
}

export function ProfileLiveryList({
  authorId,
  favoritesUserId,
  emptyMessage = "No liveries found.",
}: ProfileLiveryListProps) {
  const router = useRouter();
  // State
  const [searchValue, setSearchValue] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("latest"); // Default to latest for profile
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
    authorId,
    favoritesUserId,
  });

  // Transform posts to liveries format
  const transformPosts = useCallback(
    (posts: NonNullable<typeof result>["posts"]) => {
      return posts.map((post) => ({
        id: post._id,
        title: post.title,
        description: post.description || "",
        vehicles: post.vehicles || (post.vehicle ? [post.vehicle] : []), // Handle legacy 'vehicle' field
        vehicleTypes:
          post.vehicleTypes || (post.vehicleType ? [post.vehicleType] : []), // Handle legacy 'vehicleType' field
        thumbnailUrl: post.thumbnailUrl || "",
        username: post.authorName || "User",
        createdAt: post._creationTime, // Use _creationTime
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

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/liveries/${id}/edit`);
    },
    [router],
  );

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-4">
        <LiveriesSearch
          value={searchValue}
          onChange={setSearchValue}
          className="w-full max-w-full"
        />

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

      <div className="flex gap-8 items-start">
        {/* Sidebar Filters (Desktop) */}
        <LiveriesFiltersSidebar
          vehicleTypes={FILTER_VEHICLE_TYPES}
          selectedTypes={selectedTypes}
          onTypesChange={handleTypesChange}
          resultCount={totalCount}
          className="w-60 shrink-0 sticky top-24 hidden lg:block"
        />

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {/* Results Count Text */}
          {!isLoading && (
            <p className="text-sm text-muted-foreground mb-4">
              Showing{" "}
              <span className="font-medium text-foreground">
                {displayLiveries.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{totalCount}</span>{" "}
              items
            </p>
          )}

          <LiveriesGrid
            liveries={displayLiveries}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onEdit={authorId ? handleEdit : undefined}
            className={
              displayLiveries.length === 0 && !isLoading ? "min-h-[200px]" : ""
            }
          />
        </div>
      </div>
    </div>
  );
}
