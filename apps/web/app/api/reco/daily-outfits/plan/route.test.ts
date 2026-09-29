import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({ getSupabaseAndUser: vi.fn() }));
vi.mock('@/lib/rateLimit', () => ({ checkRateLimit: vi.fn() }));

import { GET, POST, DELETE } from './route';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';

const ITEM_A = '11111111-1111-4111-8111-111111111111';
const ITEM_B = '22222222-2222-4222-8222-222222222222';
const ROW = {
  date: '2026-09-30',
  outfit_id: 2,
  layout_slots: [
    { slotKey: 'top_inner', item: { id: ITEM_A, name: '白 T' } },
    { slotKey: 'bottom', item: { id: ITEM_B, name: '牛仔褲' } },
  ],
  occasion: 'casual',
};

// daily_outfit_plans 的查詢鏈，記下每一步收到的參數
function makeSupabase(result: { data: unknown; error: unknown }) {
  const calls: Record<string, unknown[][]> = {};
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'upsert', 'delete']) {
    chain[m] = (...args: unknown[]) => {
      (calls[m] ??= []).push(args);
      return chain;
    };
  }
  chain.maybeSingle = () => Promise.resolve(result);
  chain.single = () => Promise.resolve(result);
  chain.then = (resolve: (v: unknown) => void) => resolve(result);
  return { supabase: { from: vi.fn(() => chain) }, calls };
}

function useDb(result: { data: unknown; error: unknown }) {
  const db = makeSupabase(result);
  vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: db.supabase as never, user: { id: 'u1' } as never });
  return db;
}

function postReq(body: unknown) {
  return new NextRequest('http://localhost/api/reco/daily-outfits/plan', { method: 'POST', body: JSON.stringify(body) });
}

const VALID = {
  outfitId: 2,
  layoutSlots: [
    { slotKey: 'top_inner', item: { id: ITEM_A, name: '白 T', imageUrl: 'https://signed/1' } },
    { slotKey: 'bottom', item: { id: ITEM_B, name: '牛仔褲', imageUrl: 'https://signed/2' } },
  ],
  occasion: 'casual',
};

beforeEach(() => {
  vi.clearAllMocks();
  // 台灣 2026-09-30 01:00（UTC 還是 09-29）
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-29T17:00:00Z'));
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 29, limit: 30, resetAfter: 60, resetAt: 0 });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('/api/reco/daily-outfits/plan', () => {
  it('未登入三種方法都回 401', async () => {
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {} as never, user: null });
    expect((await GET()).status).toBe(401);
    expect((await POST(postReq(VALID))).status).toBe(401);
    expect((await DELETE()).status).toBe(401);
  });

  it('GET 用台灣日期查，回 itemIds', async () => {
    const db = useDb({ data: ROW, error: null });
    const res = await GET();
    expect(await res.json()).toEqual({
      ok: true,
      plan: { date: '2026-09-30', outfitId: 2, itemIds: [ITEM_A, ITEM_B], occasion: 'casual' },
    });
    expect(db.calls.eq).toEqual([['user_id', 'u1'], ['date', '2026-09-30']]);
  });

  it('GET 今天沒選回 plan: null', async () => {
    useDb({ data: null, error: null });
    expect(await (await GET()).json()).toEqual({ ok: true, plan: null });
  });

  it('POST 以 user_id+date upsert，只存 id 與名稱、不存會過期的圖片網址', async () => {
    const db = useDb({ data: ROW, error: null });
    const res = await POST(postReq(VALID));
    expect(res.status).toBe(200);
    const [row, opts] = db.calls.upsert[0] as [Record<string, unknown>, unknown];
    expect(opts).toEqual({ onConflict: 'user_id,date' });
    expect(row).toMatchObject({ user_id: 'u1', date: '2026-09-30', outfit_id: 2, occasion: 'casual' });
    expect(JSON.stringify(row.layout_slots)).not.toContain('signed');
  });

  it('POST 缺單品或 id 不是 uuid 回 400', async () => {
    useDb({ data: ROW, error: null });
    expect((await POST(postReq({ outfitId: 1, layoutSlots: [] }))).status).toBe(400);
    expect((await POST(postReq({ outfitId: 1, layoutSlots: [{ slotKey: 'top', item: { id: 'x' } }] }))).status).toBe(400);
  });

  it('POST 限流回 429', async () => {
    useDb({ data: ROW, error: null });
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0, limit: 30, resetAfter: 10, resetAt: 0, retryAfter: 10 });
    expect((await POST(postReq(VALID))).status).toBe(429);
  });

  it('DELETE 刪今天那筆', async () => {
    const db = useDb({ data: null, error: null });
    const res = await DELETE();
    expect(res.status).toBe(200);
    expect(db.calls.delete).toHaveLength(1);
    expect(db.calls.eq).toEqual([['user_id', 'u1'], ['date', '2026-09-30']]);
  });

  it('DB 出錯回 500 且不外洩訊息', async () => {
    useDb({ data: null, error: { message: 'secret detail' } });
    const res = await GET();
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('secret');
  });
});
