"use client";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { X, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Group vehicle types by category
const VEHICLE_TYPE_GROUPS = {
  "Fixed Wing": [
    "Ultralight",
    "Single-Engine",
    "Multi-Engine",
    "Jet",
    "Supersonic",
  ],
  "Rotorcraft & Other": ["Helicopter", "VTOL", "Airship"],
  Watercraft: ["Boat"],
};

interface LiveriesFiltersProps {
  vehicleTypes: string[];
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  resultCount: number;
  className?: string;
}

function FilterContent({
  vehicleTypes,
  selectedTypes,
  onTypesChange,
}: Omit<LiveriesFiltersProps, "resultCount" | "className">) {
  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const clearAll = () => {
    onTypesChange([]);
  };

  return (
    <div className="space-y-6">
      {/* Vehicle Type Filters */}
      <Accordion
        type="multiple"
        defaultValue={["fixed-wing", "rotorcraft-&-other"]}
        className="w-full"
      >
        {Object.entries(VEHICLE_TYPE_GROUPS).map(([groupName, types]) => {
          const availableTypes = types.filter((t) => vehicleTypes.includes(t));
          if (availableTypes.length === 0) return null;

          const accordionValue = groupName.toLowerCase().replace(/\s+/g, "-");
          const selectedInGroup = availableTypes.filter((t) =>
            selectedTypes.includes(t),
          ).length;

          return (
            <AccordionItem
              key={groupName}
              value={accordionValue}
              className="border-border/50"
            >
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                <div className="flex items-center gap-2">
                  {groupName}
                  {selectedInGroup > 0 && (
                    <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                      {selectedInGroup}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {availableTypes.map((type) => (
                    <div key={type} className="flex items-center gap-2">
                      <Checkbox
                        id={`filter-${type}`}
                        checked={selectedTypes.includes(type)}
                        onCheckedChange={() => toggleType(type)}
                      />
                      <Label
                        htmlFor={`filter-${type}`}
                        className="text-sm font-normal text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Clear All */}
      {selectedTypes.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          <X size={14} className="mr-2" />
          Clear all filters ({selectedTypes.length})
        </Button>
      )}
    </div>
  );
}

// Desktop Sidebar
export function LiveriesFiltersSidebar({
  vehicleTypes,
  selectedTypes,
  onTypesChange,
  resultCount,
  className,
}: LiveriesFiltersProps) {
  return (
    <aside
      className={cn(
        "hidden lg:block w-64 shrink-0",
        "p-6 rounded-xl",
        "bg-card/30 border border-border/50 backdrop-blur-sm",
        "sticky top-24 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-lg">Filters</h2>
        <span className="text-sm text-muted-foreground">
          {resultCount} results
        </span>
      </div>

      <FilterContent
        vehicleTypes={vehicleTypes}
        selectedTypes={selectedTypes}
        onTypesChange={onTypesChange}
      />
    </aside>
  );
}

// Mobile Sheet
export function LiveriesFiltersMobile({
  vehicleTypes,
  selectedTypes,
  onTypesChange,
  resultCount,
}: LiveriesFiltersProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <SlidersHorizontal size={16} className="mr-2" />
          Filters
          {selectedTypes.length > 0 && (
            <span className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
              {selectedTypes.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Filters
            <span className="text-sm font-normal text-muted-foreground">
              {resultCount} results
            </span>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <FilterContent
            vehicleTypes={vehicleTypes}
            selectedTypes={selectedTypes}
            onTypesChange={onTypesChange}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
