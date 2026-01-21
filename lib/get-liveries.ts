import { Vehicle } from "@/types/vehicle";

export type Livery = any;
export type LiverySort = "featured" | "most_popular" | "latest";

export default async function GetLiveries(
  amount: number,
  sort: LiverySort,
  offset: number = 0,
) {
  
}

export async function GetLiveriesByVehicleName(
  vehicleName: Vehicle[],
  amount: number,
  offset: number = 0,
) {
  
}
