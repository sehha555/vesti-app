import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({ getSupabaseAndUser: vi.fn() }));

import { GET, PUT, PATCH, DELETE } from './route';
import { getSupabaseAndUser } from '@/lib/supabase/server';

const URL_BASE = 'http://localhost/api/reco/daily-outfits/plan';

const slots = [
  { slotKey: 'top_inner', item: { id: 'c1', name: '白T', imageUrl: 'https://x/c1.png' }, priority: 1 },
  { slotKey: 'bottom', item: { id: 'c2', name: '牛仔褲', imageUrl: 'https://x/c2.png' }, priority: 3 },
];

const row = {
  date: '2026-09-25',
  outfit_id: 2,
  layout_slots: slots,
  occasion: 'casual',
  weather: null,
  updated_at: '2026-09-25T01:00:00Z',
};

/** 模擬 supabase.from('daily_outfit_plans') 的 chain，記錄每一步的參數 */
function makeSupabase(result: { data?: unknown; error?: { message: string } | null }) {
  const calls: Record<string, unknown[]> = {};
  const record = (name: string) => (...args: unknown[]) => {
    calls[name] = args;
    return chain;
  };
  const done = () => Promise.resolve({ data: result.data ?? null, error: result.error ?? null });
  const chain: Record<string, unknown> = {
    select: record('select'),
    upsert: record('upsert'),
    update: record('update'),
    delete: record('delete'),
    eq: vi.fn(() => chain),
    maybeSingle: done,
    single: done,
    then: (resolve: (v: unknown) => unknown) => done().then(resolve),
  };
  const from = vi.fn(() => chain);
  return { client: { from }, from, chain, calls };
}

function loggedIn(client: unknown) {
  vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: client as never, user: { id: 'u1' } as never });
}

function put(body: unknown) {
  return new NextRequest(URL_BASE, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/reco/daily-outfits/plan', () => {
  it('未登入回 401', async () => {
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {} as never, user: null });
    const res = await GET(new NextRequest(`${URL_BASE}?date=2026-09-25`));
    expect(res.status).toBe(401);
  });

  it('日期格式錯誤回 400', async () => {
    loggedIn(makeSupabase({}).client);
    const res = await GET(new NextRequest(`${URL_BASE}?date=today`));
    expect(res.status).toBe(400);
  });

  it('沒有計畫回 plan: null', async () => {
    const sb = makeSupabase({ data: null });
    loggedIn(sb.client);
    const res = await GET(new NextRequest(`${URL_BASE}?date=2026-09-25`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, plan: null });
  });

  it('只查自己當天的計畫並轉成 camelCase', async () => {
    const sb = makeSupabase({ data: row });
    loggedIn(sb.client);
    const res = await GET(new NextRequest(`${URL_BASE}?date=2026-09-25&userId=someone-else`));
    const body = await res.json();
    expect(sb.from).toHaveBeenCalledWith('daily_outfit_plans');
    expect(sb.chain.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(sb.chain.eq).toHaveBeenCalledWith('date', '2026-09-25');
    expect(body.plan).toMatchObject({ date: '2026-09-25', outfitId: 2, layoutSlots: slots, occasion: 'casual' });
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('DB 錯誤回 500', async () => {
    loggedIn(makeSupabase({ error: { message: 'boom' } }).client);
    const res = await GET(new NextRequest(`${URL_BASE}?date=2026-09-25`));
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/reco/daily-outfits/plan', () => {
  it('未登入回 401', async () => {
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {} as never, user: null });
    const res = await PUT(put({ date: '2026-09-25', outfitId: 1, layoutSlots: slots }));
    expect(res.status).toBe(401);
  });

  it.each([
    ['缺 layoutSlots', { date: '2026-09-25', outfitId: 1 }],
    ['layoutSlots 空陣列', { date: '2026-09-25', outfitId: 1, layoutSlots: [] }],
    ['layoutSlots 是物件（舊版前端送的 {}）', { date: '2026-09-25', outfitId: 1, layoutSlots: {} }],
    ['日期格式錯', { date: '2026/09/25', outfitId: 1, layoutSlots: slots }],
    ['outfitId 不是整數', { date: '2026-09-25', outfitId: 'outfit-1', layoutSlots: slots }],
  ])('%s 回 400', async (_label, body) => {
    loggedIn(makeSupabase({}).client);
    const res = await PUT(put(body));
    expect(res.status).toBe(400);
  });

  it('以 session 的 userId upsert（忽略 body 裡的 userId），同一天覆蓋', async () => {
    const sb = makeSupabase({ data: row });
    loggedIn(sb.client);
    const res = await PUT(
      put({ userId: 'attacker', date: '2026-09-25', outfitId: 2, layoutSlots: slots, occasion: 'casual', weather: { temp: 20 } })
    );
    expect(res.status).toBe(200);
    expect(sb.calls.upsert).toEqual([
      {
        user_id: 'u1',
        date: '2026-09-25',
        outfit_id: 2,
        layout_slots: slots,
        occasion: 'casual',
        weather: { temp: 20 },
        wore: null,
      },
      { onConflict: 'user_id,date' },
    ]);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, plan: { outfitId: 2 } });
  });

  it('DB 錯誤回 500', async () => {
    loggedIn(makeSupabase({ error: { message: 'boom' } }).client);
    const res = await PUT(put({ date: '2026-09-25', outfitId: 1, layoutSlots: slots }));
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/reco/daily-outfits/plan', () => {
  it('刪除自己當天的計畫', async () => {
    const sb = makeSupabase({ data: null });
    loggedIn(sb.client);
    const res = await DELETE(new NextRequest(`${URL_BASE}?date=2026-09-25`, { method: 'DELETE' }));
    expect(res.status).toBe(200);
    expect(sb.calls.delete).toEqual([]);
    expect(sb.chain.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(sb.chain.eq).toHaveBeenCalledWith('date', '2026-09-25');
  });

  it('日期格式錯誤回 400', async () => {
    loggedIn(makeSupabase({}).client);
    const res = await DELETE(new NextRequest(`${URL_BASE}`, { method: 'DELETE' }));
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/reco/daily-outfits/plan', () => {
  const patch = (body: unknown) =>
    new NextRequest(URL_BASE, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  it('記錄有沒有穿（只改自己當天的計畫）', async () => {
    const sb = makeSupabase({ data: { ...row, wore: true } });
    loggedIn(sb.client);
    const res = await PATCH(patch({ date: '2026-09-25', wore: true }));
    expect(res.status).toBe(200);
    expect(sb.calls.update).toEqual([{ wore: true }]);
    expect(sb.chain.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(sb.chain.eq).toHaveBeenCalledWith('date', '2026-09-25');
    expect((await res.json()).plan.wore).toBe(true);
  });

  it('那天沒有計畫回 404', async () => {
    loggedIn(makeSupabase({ data: null }).client);
    const res = await PATCH(patch({ date: '2026-09-25', wore: false }));
    expect(res.status).toBe(404);
  });

  it('wore 不是 boolean 回 400', async () => {
    loggedIn(makeSupabase({}).client);
    const res = await PATCH(patch({ date: '2026-09-25', wore: 'yes' }));
    expect(res.status).toBe(400);
  });
});
