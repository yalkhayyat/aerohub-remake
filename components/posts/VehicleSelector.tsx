"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ALL_VEHICLES, type Vehicle } from "@/types/vehicle";

interface VehicleSelectorProps {
  value: Vehicle | null;
  onValueChange: (value: Vehicle | null) => void;
  disabled?: boolean;
}

export function VehicleSelector({
  value,
  onValueChange,
  disabled = false,
}: VehicleSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter vehicles based on search query
  const filteredVehicles = React.useMemo(() => {
    if (!searchQuery) {
      // Show first 50 when no search
      return ALL_VEHICLES.slice(0, 50);
    }
    const query = searchQuery.toLowerCase();
    return ALL_VEHICLES.filter((vehicle) =>
      vehicle.toLowerCase().includes(query),
    ).slice(0, 50); // Limit to 50 results for performance
  }, [searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          {value ? (
            <span className="truncate">{value}</span>
          ) : (
            <span className="text-muted-foreground">Select vehicle...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search vehicles..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No vehicle found.</CommandEmpty>
            <CommandGroup>
              {filteredVehicles.map((vehicle) => (
                <CommandItem
                  key={vehicle}
                  value={vehicle}
                  onSelect={() => {
                    onValueChange(vehicle === value ? null : vehicle);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === vehicle ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{vehicle}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {filteredVehicles.length === 50 && (
              <div className="p-2 text-center text-xs text-muted-foreground">
                Showing first 50 results. Type to search more...
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
