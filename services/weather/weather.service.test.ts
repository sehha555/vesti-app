import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import { getCurrentWeather } from './weather.service';

vi.mock('axios');
vi.mock('p-retry', () => ({ default: (fn: any) => fn() }));

const mockedAxios = axios as any;

describe('WeatherService', () => {
  beforeEach(() => {
    process.env.WEATHER_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should get weather data', async () => {
    const mockResponse = {
      data: {
        main: { temp: 25, feels_like: 26, humidity: 70 },
        weather: [{ main: 'Clear' }],
        clouds: { all: 10 },
        rain: { '1h': 0 },
        wind: { speed: 5 },
        dt: 1633372800
      }
    };
    mockedAxios.get.mockResolvedValue(mockResponse);
    const result = await getCurrentWeather({ lat: 25.03, lon: 121.56 });
    expect(result.temperature).toBe(25);
    expect(result.humidity).toBe(70);
  });

  it('should handle API errors', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));
    const result = await getCurrentWeather({ lat: 25.03, lon: 121.56 });
    expect(result.temperature).toBe(25);
  });
});