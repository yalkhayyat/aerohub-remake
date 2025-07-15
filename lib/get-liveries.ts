import { createClient } from "@/lib/supabase/server";
import { Database, Tables } from "@/types/supabase";
import { Vehicle } from "@/types/vehicle";

export type Livery = Tables<"liveries">;
export type LiverySort = "featured" | "most_popular" | "latest";

export default async function GetLiveries(
  amount: number,
  sort: LiverySort,
  offset: number = 0
) {
  const supabase = await createClient();

  let query = supabase.from("liveries").select("*");

  switch (sort) {
    case "featured":
      const oneWeekAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      query = query
        .gte("created_at", oneWeekAgo)
        .order("likes", { ascending: false })
        .order("saves", { ascending: false })
        .order("created_at", { ascending: false });
      break;

    case "latest":
      query = query.order("created_at", { ascending: false });
      break;

    case "most_popular":
      query = query
        .order("likes", { ascending: false })
        .order("saves", { ascending: false })
        .order("created_at", { ascending: false });
      break;

    default:
      console.error("Error fetching liveries: no sort specified.");
      break;
  }

  query = query.range(offset, offset + amount - 1);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching liveries:", error.message);
  }

  return (data || []) as Livery[];
}

export async function GetLiveriesByVehicleName(
  vehicleName: Vehicle[],
  amount: number,
  offset: number = 0
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("liveries")
    .select("*")
    .in("vehicle_name", vehicleName)
    .range(offset, offset + amount - 1);

  if (error) {
    console.error("Error fetching liveries by vehicle name:", error.message);
  }

  return (data || []) as Livery[];
}
