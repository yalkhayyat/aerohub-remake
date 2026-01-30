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
  value: string[];
  onValueChange: (value: string[]) => void;
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

  const handleSelect = (vehicle: string) => {
    if (value.includes(vehicle)) {
      onValueChange(value.filter((v) => v !== vehicle));
    } else {
      onValueChange([...value, vehicle]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between h-auto min-h-[10px] py-2"
        >
          {value.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {value.map((v) => (
                <span
                  key={v}
                  className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md text-xs truncate max-w-[200px]"
                >
                  {v}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">Select vehicles...</span>
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
              {filteredVehicles.map((vehicle) => {
                const isSelected = value.includes(vehicle);
                return (
                  <CommandItem
                    key={vehicle}
                    value={vehicle}
                    onSelect={() => handleSelect(vehicle)}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <Check className={cn("h-4 w-4")} />
                    </div>
                    <span className="truncate">{vehicle}</span>
                  </CommandItem>
                );
              })}
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
