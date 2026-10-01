import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// 路由用使用者自己的 client（RLS），所有查詢都經過這個 from
const { dbFrom } = vi.hoisted(() => ({ dbFrom: vi.fn() }));

vi.mock('@/lib/supabase/server', () => ({ getSupabaseAndUser: vi.fn() }));
vi.mock('@/lib/rateLimit', () => ({ checkRateLimit: vi.fn() }));
vi.mock('@/lib/metrics', () => ({ logSecurityEvent: vi.fn() }));
vi.mock('@/lib/closet/storage', () => ({ freshSignedUrls: vi.fn() }));

import { GET, POST, DELETE } from './route';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { freshSignedUrls } from '@/lib/closet/storage';

const BASE = 'http://localhost/api/saved-outfits';
const SAVED_ID = '11111111-1111-4111-8111-111111111111';

const slots = [
  { slotKey: 'top_inner', item: { id: 'c2', name: '白T', imageUrl: 'https://old/c2' }, priority: 1 },
  { slotKey: 'bottom', item: { id: 'c1', name: '牛仔褲', imageUrl: 'https://old/c1' }, priority: 3 },
];

/** 一個可以 await 的 query chain，記錄呼叫過的方法與參數 */
function chain(result: { data?: unknown; error?: { message: string } | null }) {
  const calls: Array<[string, unknown[]]> = [];
  const q: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'in', 'order', 'limit', 'contains', 'insert', 'delete']) {
    q[m] = (...args: unknown[]) => {
      calls.push([m, args]);
      return q;
    };
  }
  const done = () => Promise.resolve({ data: result.data ?? null, error: result.error ?? null });
  q.single = done;
  q.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => done().then(resolve, reject);
  return { q, calls };
}

function loggedIn() {
  vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: { from: dbFrom } as never, user: { id: 'u1' } as never });
}

function post(body: unknown) {
  return new NextRequest(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 9, limit: 10, resetAfter: 60, resetAt: 0 });
});

describe('POST /api/saved-outfits', () => {
  it('未登入回 401', async () => {
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {} as never, user: null });
    const res = await POST(post({ outfitData: { imageUrl: 'x', styleName: 'y' } }));
    expect(res.status).toBe(401);
  });

  it('限流回 429', async () => {
    loggedIn();
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0, limit: 20, resetAfter: 30, resetAt: 0, retryAfter: 30 });
    const res = await POST(post({ outfitData: { imageUrl: 'x', styleName: 'y' } }));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('30');
  });

  it('缺 styleName 回 400', async () => {
    loggedIn();
    const res = await POST(post({ outfitData: { imageUrl: 'x' } }));
    expect(res.status).toBe(400);
    expect(dbFrom).not.toHaveBeenCalled();
  });

  it('同一套（同樣幾件衣服）已收藏過就回既有那筆，不重複寫入', async () => {
    loggedIn();
    const existing = { id: SAVED_ID, outfit_data: { key: 'c1|c2' } };
    const dup = chain({ data: [existing] });
    dbFrom.mockReturnValueOnce(dup.q);

    const res = await POST(post({ outfitData: { imageUrl: 'x', styleName: '休閒', layoutSlots: slots } }));

    expect(res.status).toBe(200);
    expect((await res.json()).savedOutfit).toEqual(existing);
    expect(dup.calls).toContainEqual(['contains', ['outfit_data', { key: 'c1|c2' }]]);
    expect(dup.calls).toContainEqual(['eq', ['user_id', 'u1']]);
    expect(dbFrom).toHaveBeenCalledTimes(1);
  });

  it('新的穿搭：以 session userId 寫入，outfit_data 帶 key', async () => {
    loggedIn();
    const dup = chain({ data: [] });
    const ins = chain({ data: { id: SAVED_ID } });
    dbFrom.mockReturnValueOnce(dup.q).mockReturnValueOnce(ins.q);

    const res = await POST(
      post({ outfitData: { imageUrl: 'x', styleName: '休閒', description: 'd', layoutSlots: slots }, occasion: 'work' })
    );

    expect(res.status).toBe(201);
    const [, [rows]] = ins.calls.find(([m]) => m === 'insert')!;
    expect(rows).toEqual([
      {
        user_id: 'u1',
        outfit_data: { imageUrl: 'x', styleName: '休閒', description: 'd', layoutSlots: slots, key: 'c1|c2' },
        weather_info: null,
        occasion: 'work',
        outfit_type: 'saved',
      },
    ]);
  });

  it('寫入失敗回 500 且不外洩 DB 錯誤訊息', async () => {
    loggedIn();
    dbFrom.mockReturnValueOnce(chain({ data: [] }).q).mockReturnValueOnce(chain({ error: { message: 'secret db detail' } }).q);
    const res = await POST(post({ outfitData: { imageUrl: 'x', styleName: '休閒', layoutSlots: slots } }));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('secret db detail');
  });
});

describe('GET /api/saved-outfits', () => {
  it('回傳前把單品圖片換成新的簽章網址，封面用第一件', async () => {
    const closet = chain({ data: [{ id: 'c1', image_url: 'p1' }, { id: 'c2', image_url: 'p2' }] });
    loggedIn();
    dbFrom
      .mockReturnValueOnce(
        chain({
          data: [{ id: SAVED_ID, outfit_data: { imageUrl: 'https://old/c2', styleName: '休閒', layoutSlots: slots, key: 'c1|c2' } }],
        }).q
      )
      .mockReturnValueOnce(closet.q);
    vi.mocked(freshSignedUrls).mockResolvedValue(new Map([['c1', 'https://new/c1'], ['c2', 'https://new/c2']]));

    const res = await GET(new NextRequest(BASE));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(dbFrom).toHaveBeenNthCalledWith(1, 'saved_outfits');
    expect(dbFrom).toHaveBeenNthCalledWith(2, 'closet_items');
    expect(closet.calls).toContainEqual(['eq', ['user_id', 'u1']]);
    const outfit = body.outfits[0].outfit_data;
    expect(outfit.layoutSlots.map((s: { item: { imageUrl: string } }) => s.item.imageUrl)).toEqual([
      'https://new/c2',
      'https://new/c1',
    ]);
    expect(outfit.imageUrl).toBe('https://new/c2');
  });

  it('沒有單品資料的舊收藏原樣回傳', async () => {
    loggedIn();
    const legacy = { id: SAVED_ID, outfit_data: { imageUrl: 'https://img', styleName: 'old' } };
    dbFrom.mockReturnValueOnce(chain({ data: [legacy] }).q);

    const res = await GET(new NextRequest(BASE));
    expect((await res.json()).outfits).toEqual([legacy]);
    expect(freshSignedUrls).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/saved-outfits', () => {
  it('id 不是 uuid 回 400', async () => {
    loggedIn();
    const res = await DELETE(new NextRequest(`${BASE}?id=abc`, { method: 'DELETE' }));
    expect(res.status).toBe(400);
  });

  it('刪除自己的收藏', async () => {
    loggedIn();
    const del = chain({ data: [{ id: SAVED_ID }] });
    dbFrom.mockReturnValueOnce(del.q);

    const res = await DELETE(new NextRequest(`${BASE}?id=${SAVED_ID}`, { method: 'DELETE' }));

    expect(res.status).toBe(200);
    expect(del.calls).toContainEqual(['eq', ['id', SAVED_ID]]);
    expect(del.calls).toContainEqual(['eq', ['user_id', 'u1']]);
  });

  it('不存在或不是自己的回 404', async () => {
    loggedIn();
    dbFrom.mockReturnValueOnce(chain({ data: [] }).q);
    const res = await DELETE(new NextRequest(`${BASE}?id=${SAVED_ID}`, { method: 'DELETE' }));
    expect(res.status).toBe(404);
  });
});
