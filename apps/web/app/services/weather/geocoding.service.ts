/**
 * Geocoding Service (stub)
 * Re-export from root services for type checking
 * Real implementation is in /services/weather/geocoding.service.ts
 */

export const DEFAULT_LOCATION = { lat: 25.0330, lon: 121.5654 };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function geocodeLocation(location: string) {
  try {
    // This is a stub - in production, import from the actual service at repo root
    // For now, return default location
    return DEFAULT_LOCATION;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
