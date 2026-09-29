import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({ getSupabaseAndUser: vi.fn() }));
vi.mock('@/lib/rateLimit', () => ({ checkRateLimit: vi.fn() }));
vi.mock('@/services/weather', () => ({ getWeather: vi.fn() }));
vi.mock('../../../lib/ai/suggest-outfits', () => ({ pickOutfits: vi.fn(), resolveOutfits: vi.fn() }));

import { GET } from './route';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getWeather } from '@/services/weather';
import { pickOutfits, resolveOutfits } from '../../../lib/ai/suggest-outfits';

const WEATHER = { temperature: 30, feelsLike: 33, humidity: 70, condition: 'sunny', windSpeed: 5, locationName: '台北' };
const RAW = [{ title: '清爽', reason: '熱', slots: [{ slotKey: 'top_inner', itemId: 'a' }] }];
const OUTFIT = { id: 1, styleName: '清爽', description: '熱', imageUrl: 'https://x/1', layoutSlots: [] };

// daily_recommendations 的查詢鏈：select().eq().eq().eq().maybeSingle()，以及 upsert()
function makeSupabase(stored: unknown) {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: vi.fn().mockResolvedValue({ data: stored, error: null }),
    upsert,
  };
  return { supabase: { from: vi.fn(() => chain) }, upsert };
}

function makeReq(query: string) {
  return new NextRequest(`http://localhost/api/daily-outfits?${query}`);
}

let db: ReturnType<typeof makeSupabase>;

beforeEach(() => {
  vi.clearAllMocks();
  db = makeSupabase(null);
  vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: db.supabase as never, user: { id: 'u1' } as never });
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 19, limit: 20, resetAfter: 3600, resetAt: 0 });
  vi.mocked(getWeather).mockResolvedValue(WEATHER as never);
  vi.mocked(pickOutfits).mockResolvedValue(RAW as never);
  vi.mocked(resolveOutfits).mockResolvedValue([OUTFIT] as never);
});

const QUERY = 'latitude=25&longitude=121.5&occasion=casual';

describe('GET /api/daily-outfits', () => {
  it('未登入回 401', async () => {
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {} as never, user: null });
    expect((await GET(makeReq(QUERY))).status).toBe(401);
  });

  it('經緯度不合法回 400', async () => {
    expect((await GET(makeReq('latitude=abc&longitude=121.5&occasion=casual'))).status).toBe(400);
  });

  it('occasion 不在清單回 400', async () => {
    expect((await GET(makeReq('latitude=25&longitude=121.5&occasion=party'))).status).toBe(400);
  });

  it('沒存過：叫模型、回 { outfits, weather }、把 item id 與位置存進表', async () => {
    const res = await GET(makeReq(QUERY));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ outfits: [OUTFIT], weather: WEATHER });
    expect(pickOutfits).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1', occasion: 'casual' }));
    expect(db.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1', occasion: 'casual', outfits: RAW, latitude: 25, longitude: 121.5 })
    );
  });

  it('已存過：不叫模型、不算限流，直接組回', async () => {
    db = makeSupabase({ outfits: RAW });
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: db.supabase as never, user: { id: 'u1' } as never });
    const res = await GET(makeReq(QUERY));
    expect((await res.json()).outfits).toEqual([OUTFIT]);
    expect(pickOutfits).not.toHaveBeenCalled();
    expect(checkRateLimit).not.toHaveBeenCalled();
    expect(resolveOutfits).toHaveBeenCalledWith(db.supabase, 'u1', RAW);
  });

  it('存的衣服全被刪掉時重算', async () => {
    db = makeSupabase({ outfits: RAW });
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: db.supabase as never, user: { id: 'u1' } as never });
    vi.mocked(resolveOutfits).mockResolvedValueOnce([]).mockResolvedValueOnce([OUTFIT] as never);
    const res = await GET(makeReq(QUERY));
    expect((await res.json()).outfits).toEqual([OUTFIT]);
    expect(pickOutfits).toHaveBeenCalledTimes(1);
  });

  it('衣櫃不足時 outfits 空陣列且不存表', async () => {
    vi.mocked(pickOutfits).mockResolvedValue([]);
    vi.mocked(resolveOutfits).mockResolvedValue([]);
    const res = await GET(makeReq(QUERY));
    expect((await res.json()).outfits).toEqual([]);
    expect(db.upsert).not.toHaveBeenCalled();
  });

  it('限流回 429', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0, limit: 20, resetAfter: 100, resetAt: 0, retryAfter: 100 });
    const res = await GET(makeReq(QUERY));
    expect(res.status).toBe(429);
    expect(pickOutfits).not.toHaveBeenCalled();
  });

  it('模型失敗回 500 且不外洩訊息', async () => {
    vi.mocked(pickOutfits).mockRejectedValue(new Error('secret detail'));
    const res = await GET(makeReq(QUERY));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('secret');
  });
});
