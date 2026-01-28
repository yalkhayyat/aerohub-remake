
import os

input_file = r'c:\Users\yalkh\Documents\Projects\aerohub-remake\vehicle_sheet.txt'
output_file = r'c:\Users\yalkh\Documents\Projects\aerohub-remake\types\vehicle.ts'

# Manual fixes/overrides if needed.
# For now straight parsing.

vehicle_data = {}
all_types = set()

with open(input_file, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        try:
            parts = line.split('\t')
            if len(parts) >= 2:
                v_type = parts[0].strip()
                v_name = parts[1].strip()
                vehicle_data[v_name] = v_type
                all_types.add(v_type)
        except Exception as e:
            print(f"Error parsing line: {line} - {e}")

# Generate TypeScript content
ts_content = "export const VEHICLE_DATA = {\n"
for v_name, v_type in vehicle_data.items():
    # Escape quotes in keys if necessary, though vehicle names seem clean.
    # safest is to use string keys.
    ts_content += f'  "{v_name}": "{v_type}",\n'
ts_content += "} as const;\n\n"

ts_content += "export const ALL_VEHICLES = Object.keys(VEHICLE_DATA) as (keyof typeof VEHICLE_DATA)[];\n\n"

ts_content += "export type Vehicle = keyof typeof VEHICLE_DATA;\n"
ts_content += "export type VehicleType = typeof VEHICLE_DATA[Vehicle];\n\n"

ts_content += "export const VEHICLE_TYPES = [\n"
for t in sorted(list(all_types)):
    ts_content += f'  "{t}",\n'
ts_content += "] as const;\n\n"

ts_content += """export function isVehicle(str: string): str is Vehicle {
  return str in VEHICLE_DATA;
}

export function getVehicleType(vehicle: Vehicle): VehicleType {
  return VEHICLE_DATA[vehicle];
}
"""

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Generated {output_file} with {len(vehicle_data)} vehicles and {len(all_types)} types.")
