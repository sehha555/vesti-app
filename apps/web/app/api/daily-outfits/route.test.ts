import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({ getSupabaseAndUser: vi.fn() }));
vi.mock('@/lib/rateLimit', () => ({ checkRateLimit: vi.fn() }));
vi.mock('@/services/weather', () => ({ getWeather: vi.fn() }));
vi.mock('../../../lib/ai/suggest-outfits', () => ({ pickOutfits: vi.fn(), resolveOutfits: vi.fn() }));
vi.mock('../../../lib/tryon/jobs', () => ({ ensureTryonJobs: vi.fn(), cancelQueuedTryonJobs: vi.fn() }));

import { GET } from './route';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getWeather } from '@/services/weather';
import { pickOutfits, resolveOutfits } from '../../../lib/ai/suggest-outfits';
import { cancelQueuedTryonJobs, ensureTryonJobs } from '../../../lib/tryon/jobs';

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
  vi.mocked(pickOutfits).mockResolvedValue({ raw: RAW, reason: 'OK' } as never);
  vi.mocked(resolveOutfits).mockResolvedValue([OUTFIT] as never);
  vi.mocked(ensureTryonJobs).mockResolvedValue(new Map());
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

  it('情境超過 100 字回 400', async () => {
    expect((await GET(makeReq(`latitude=25&longitude=121.5&occasion=${'a'.repeat(101)}`))).status).toBe(400);
  });

  it('沒帶情境：以空字串當 key 算推薦並存表', async () => {
    await GET(makeReq('latitude=25&longitude=121.5'));
    expect(pickOutfits).toHaveBeenCalledWith(expect.objectContaining({ occasion: '' }));
    expect(db.upsert).toHaveBeenCalledWith(expect.objectContaining({ occasion: '' }));
  });

  it('沒存過：叫模型、回 { outfits, weather, reason }、把 item id 與位置存進表', async () => {
    const res = await GET(makeReq(QUERY));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ outfits: [OUTFIT], weather: WEATHER, reason: 'OK' });
    expect(pickOutfits).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1', occasion: 'casual' }));
    expect(db.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1', occasion: 'casual', outfits: RAW, latitude: 25, longitude: 121.5 })
    );
  });

  it.each([
    ['沒存過', null],
    ['已存過', { outfits: RAW }],
  ])('%s：每套登記試穿工作並附上試穿狀態', async (_label, stored) => {
    db = makeSupabase(stored);
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: db.supabase as never, user: { id: 'u1' } as never });
    vi.mocked(ensureTryonJobs).mockResolvedValue(new Map([[1, { jobId: 'j1', status: 'queued' as const }]]));
    const body = await (await GET(makeReq(QUERY))).json();
    expect(ensureTryonJobs).toHaveBeenCalledWith(db.supabase, 'u1', [OUTFIT]);
    expect(body.outfits).toEqual([{ ...OUTFIT, tryon: { jobId: 'j1', status: 'queued' } }]);
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

  it('衣櫃不足時 outfits 空陣列、附原因、不存表', async () => {
    vi.mocked(pickOutfits).mockResolvedValue({ raw: [], reason: 'CLOSET_TOO_SMALL' });
    vi.mocked(resolveOutfits).mockResolvedValue([]);
    const body = await (await GET(makeReq(QUERY))).json();
    expect(body.outfits).toEqual([]);
    expect(body.reason).toBe('CLOSET_TOO_SMALL');
    expect(body.weather).toBeDefined();
    expect(db.upsert).not.toHaveBeenCalled();
  });

  it('限流回 429', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0, limit: 20, resetAfter: 100, resetAt: 0, retryAfter: 100 });
    const res = await GET(makeReq(QUERY));
    expect(res.status).toBe(429);
    expect(pickOutfits).not.toHaveBeenCalled();
  });

  it('模型失敗仍回 200 與天氣，reason 為 AI_UNAVAILABLE，不外洩訊息、不存表', async () => {
    vi.mocked(pickOutfits).mockRejectedValue(new Error('secret detail'));
    const res = await GET(makeReq(QUERY));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ outfits: [], reason: 'AI_UNAVAILABLE' });
    expect(body.weather).toBeDefined();
    expect(JSON.stringify(body)).not.toContain('secret');
    expect(db.upsert).not.toHaveBeenCalled();
  });

  describe('換一批 refresh=1', () => {
    const NEW_RAW = [{ title: '新的', reason: '換', slots: [{ slotKey: 'top_inner', itemId: 'z' }] }];
    const NEW_OUTFIT = { ...OUTFIT, styleName: '新的' };
    const REFRESH = `${QUERY}&refresh=1`;

    beforeEach(() => {
      db = makeSupabase({ outfits: RAW });
      vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: db.supabase as never, user: { id: 'u1' } as never });
    });

    it('已存過也重挑：請模型避開剛給過的、新結果蓋掉存的、取消排隊中的試穿再登記新的', async () => {
      vi.mocked(pickOutfits).mockResolvedValue({ raw: NEW_RAW, reason: 'OK' } as never);
      vi.mocked(resolveOutfits).mockResolvedValue([NEW_OUTFIT] as never);
      const order: string[] = [];
      vi.mocked(cancelQueuedTryonJobs).mockImplementation(async () => void order.push('cancel'));
      vi.mocked(ensureTryonJobs).mockImplementation(async () => (order.push('ensure'), new Map()));

      const body = await (await GET(makeReq(REFRESH))).json();
      expect(body.outfits).toEqual([NEW_OUTFIT]);
      expect(checkRateLimit).toHaveBeenCalled();
      expect(pickOutfits).toHaveBeenCalledWith(expect.objectContaining({ avoid: RAW }));
      expect(db.upsert).toHaveBeenCalledWith(expect.objectContaining({ outfits: NEW_RAW }));
      expect(cancelQueuedTryonJobs).toHaveBeenCalledWith(db.supabase, 'u1');
      expect(order).toEqual(['cancel', 'ensure']);
    });

    it('重挑失敗：回原本那幾套並附原因，不存表、不取消試穿', async () => {
      vi.mocked(pickOutfits).mockRejectedValue(new Error('boom'));
      const body = await (await GET(makeReq(REFRESH))).json();
      expect(body).toMatchObject({ outfits: [OUTFIT], reason: 'AI_UNAVAILABLE' });
      expect(resolveOutfits).toHaveBeenCalledWith(db.supabase, 'u1', RAW);
      expect(db.upsert).not.toHaveBeenCalled();
      expect(cancelQueuedTryonJobs).not.toHaveBeenCalled();
    });

    it('模型又給了剛給過的組合就濾掉，全部重複時回原本那幾套', async () => {
      vi.mocked(pickOutfits).mockResolvedValue({ raw: [...RAW], reason: 'OK' } as never);
      vi.mocked(resolveOutfits).mockImplementation(async (_s, _u, raw) => (raw.length ? [OUTFIT] : []) as never);
      const body = await (await GET(makeReq(REFRESH))).json();
      expect(vi.mocked(resolveOutfits).mock.calls[0][2]).toEqual([]);
      expect(body).toMatchObject({ outfits: [OUTFIT], reason: 'NO_OUTFIT' });
      expect(db.upsert).not.toHaveBeenCalled();
    });

    it('限流時回 429，不叫模型', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0, limit: 20, resetAfter: 100, resetAt: 0, retryAfter: 100 });
      expect((await GET(makeReq(REFRESH))).status).toBe(429);
      expect(pickOutfits).not.toHaveBeenCalled();
      expect(cancelQueuedTryonJobs).not.toHaveBeenCalled();
    });

    it('沒帶 refresh 時不取消試穿、不帶 avoid', async () => {
      db = makeSupabase(null);
      vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: db.supabase as never, user: { id: 'u1' } as never });
      await GET(makeReq(QUERY));
      expect(cancelQueuedTryonJobs).not.toHaveBeenCalled();
      expect(vi.mocked(pickOutfits).mock.calls[0][0]).not.toHaveProperty('avoid');
    });
  });
});

