import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({ getSupabaseAndUser: vi.fn() }));
vi.mock('@/lib/rateLimit', () => ({ checkRateLimit: vi.fn(), cacheResponse: vi.fn(), getCachedResponse: vi.fn() }));
vi.mock('../../../lib/ai/suggest-outfits', () => ({ suggestOutfits: vi.fn() }));

import { GET } from './route';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit, cacheResponse, getCachedResponse } from '@/lib/rateLimit';
import { suggestOutfits } from '../../../lib/ai/suggest-outfits';

const WEATHER = { temperature: 30, feelsLike: 33, humidity: 70, condition: 'sunny', windSpeed: 5, locationName: '台北' };
const OUTFIT = { id: 1, styleName: '清爽', description: '熱', imageUrl: 'https://x/1', layoutSlots: [] };

function makeReq(query: string) {
  return new NextRequest(`http://localhost/api/daily-outfits?${query}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {} as never, user: { id: 'u1' } as never });
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 19, limit: 20, resetAfter: 3600, resetAt: 0 });
  vi.mocked(getCachedResponse).mockResolvedValue(null);
  vi.mocked(suggestOutfits).mockResolvedValue([OUTFIT]);
});

describe('GET /api/daily-outfits', () => {
  it('未登入回 401', async () => {
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {} as never, user: null });
    const res = await GET(makeReq('latitude=25&longitude=121.5&occasion=casual'));
    expect(res.status).toBe(401);
  });

  it('經緯度不合法回 400', async () => {
    const res = await GET(makeReq('latitude=abc&longitude=121.5&occasion=casual'));
    expect(res.status).toBe(400);
  });

  it('occasion 不在清單回 400', async () => {
    const res = await GET(makeReq('latitude=25&longitude=121.5&occasion=party'));
    expect(res.status).toBe(400);
  });

  it('回 { outfits, weather }，userId 來自 session，並寫入快取', async () => {
    const res = await GET(makeReq('latitude=25&longitude=121.5&occasion=casual'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.outfits).toEqual([OUTFIT]);
    expect(body.weather).toMatchObject({ temperature: expect.any(Number) });
    expect(suggestOutfits).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1', occasion: 'casual' }));
    expect(cacheResponse).toHaveBeenCalledWith(expect.stringMatching(/^daily-outfit:u1:\d{4}-\d{2}-\d{2}:casual$/), expect.anything(), 900);
  });

  it('快取命中時不呼叫模型、不算限流', async () => {
    vi.mocked(getCachedResponse).mockResolvedValue({ outfits: [OUTFIT], weather: WEATHER });
    const res = await GET(makeReq('latitude=25&longitude=121.5&occasion=casual'));
    expect(res.status).toBe(200);
    expect(suggestOutfits).not.toHaveBeenCalled();
    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it('衣櫃不足時 outfits 空陣列且不寫快取', async () => {
    vi.mocked(suggestOutfits).mockResolvedValue([]);
    const res = await GET(makeReq('latitude=25&longitude=121.5&occasion=casual'));
    expect((await res.json()).outfits).toEqual([]);
    expect(cacheResponse).not.toHaveBeenCalled();
  });

  it('限流回 429', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0, limit: 20, resetAfter: 100, resetAt: 0, retryAfter: 100 });
    const res = await GET(makeReq('latitude=25&longitude=121.5&occasion=casual'));
    expect(res.status).toBe(429);
    expect(suggestOutfits).not.toHaveBeenCalled();
  });

  it('模型失敗回 500 且不外洩訊息', async () => {
    vi.mocked(suggestOutfits).mockRejectedValue(new Error('secret detail'));
    const res = await GET(makeReq('latitude=25&longitude=121.5&occasion=casual'));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('secret');
  });
});
