  import { vi } from 'vitest';

  // ============================================
  // Global Mock Setup for apps/web Tests
  // ============================================

  // Single instance for requireBffAuth that can be controlled per test
  const requireBffAuthMock = vi.fn(async (request) => ({
    authorized: true,
    userId: 'test-user-id',
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
    },
  }));

  // Mock @/middleware/auth - BFF authentication middleware
  // Uses the single instance to allow per-test control
  vi.mock('@/middleware/auth', () => ({
    requireBffAuth: requireBffAuthMock,
  }));

  // Also mock with relative paths for tests that use relative imports
  vi.mock('app/api/_middleware/auth', () => ({
    requireBffAuth: requireBffAuthMock,
  }));

  vi.mock('./app/api/_middleware/auth', () => ({
    requireBffAuth: requireBffAuthMock,
  }));

  vi.mock('../../../../_middleware/auth', () => ({
    requireBffAuth: requireBffAuthMock,
  }));

  vi.mock('../../_middleware/auth', () => ({
    requireBffAuth: requireBffAuthMock,
  }));

  // Single instance for geocodeLocation spy tracking
  const geocodeLocationMock = vi.fn(async (location: string) => {
    const locations: Record<string, { lat: number; lon: number } | null> = {
      'taipei': { lat: 25.033, lon: 121.5654 },
      'kaohsiung': { lat: 22.6273, lon: 120.3014 },
      'unknown': null,
    };

    const key = location.toLowerCase();
    return locations[key] || null;
  });

  // Single instance for getWeather spy tracking
  const getWeatherMock = vi.fn(async (coords: { lat: number; lon: number }) => {
    const tempByLocation: Record<string, number> = {
      '25.03,121.57': 15,
      '22.63,120.30': 20,
    };

    const key = `${coords.lat.toFixed(2)},${coords.lon.toFixed(2)}`;
    const temperature = tempByLocation[key] || 20;

    return {
      temperature,
      feelsLike: temperature - 2,
      humidity: 70,
      condition: 'cloudy',
      windSpeed: 10,
      locationName: 'Test Location',
    };
  });

  // Mock @/lib/supabaseClient - used for dynamic imports in route handlers
  vi.mock('@/lib/supabaseClient', () => ({
    supabaseAdmin: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: [], error: null })),
          order: vi.fn(function() { return this; }),
          limit: vi.fn(function() { return this; }),
          single: vi.fn(async () => ({ data: null, error: null })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => ({ data: {}, error: null })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: null, error: null })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: null, error: null })),
        })),
      })),
    },
  }));

  // Mock weather services with single instances for spy tracking
  // Define mocks for both relative and alias paths to catch all imports
  vi.mock('@/services/weather/geocoding.service', () => ({
    geocodeLocation: geocodeLocationMock,
    DEFAULT_LOCATION: { lat: 25.033, lon: 121.5654 },
  }));

  vi.mock('@/services/weather', () => ({
    getWeather: getWeatherMock,
  }));

  vi.mock('../../../../../services/weather/geocoding.service', () => ({
    geocodeLocation: geocodeLocationMock,
    DEFAULT_LOCATION: { lat: 25.033, lon: 121.5654 },
  }));

  vi.mock('../../../../../services/weather', () => ({
    getWeather: getWeatherMock,
  }));

  // Export the mocks so tests can control them
  export { requireBffAuthMock, geocodeLocationMock, getWeatherMock };
