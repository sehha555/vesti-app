import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({ getSupabaseAndUser: vi.fn() }));
vi.mock('@/lib/rateLimit', () => ({ checkRateLimit: vi.fn() }));
vi.mock('@/lib/ai/tag-item', () => ({ tagClosetItem: vi.fn() }));
vi.mock('@/lib/closet/storage', () => ({
  downloadClosetImage: vi.fn(async () => ({ buffer: Buffer.from('x'), mimeType: 'image/png' })),
  storagePathFromImageUrl: (u: string) => u,
}));

import { POST } from './route';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { tagClosetItem } from '@/lib/ai/tag-item';

const attrs = {
  version: 1 as const,
  category: 'top' as const,
  subcategory: '襯衫',
  name: '白色襯衫',
  colors: ['白'],
  pattern: 'solid' as const,
  warmth: 3,
  formality: 3,
  styles: ['簡約'],
  seasons: ['spring' as const],
};

function loggedIn(rows: Array<{ id: string; name: string; category: string; image_url: string }>, remaining = 0) {
  const updates: Array<{ values: Record<string, unknown>; id: string }> = [];
  const selectChain = (head: boolean) => {
    const chain: Record<string, unknown> = {};
    for (const m of ['eq', 'is', 'not', 'order']) chain[m] = () => chain;
    chain.limit = async () => ({ data: rows, error: null });
    // head 查詢直接被 await
    chain.then = (resolve: (v: unknown) => void) => resolve({ count: remaining, error: null });
    return head ? chain : { ...chain, then: undefined };
  };
  const from = vi.fn((table: string) => {
    if (table === 'active_closet_items') {
      return { select: (_c: string, opts: { head: boolean }) => selectChain(opts.head) };
    }
    return {
      update: (values: Record<string, unknown>) => ({
        eq: (_k: string, id: string) => ({
          eq: async () => {
            updates.push({ values, id });
            return { error: null };
          },
        }),
      }),
    };
  });
  vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: { from } as never, user: { id: 'u1' } as never });
  return { updates };
}

const req = () => new NextRequest('http://localhost/api/closet-items/analyze', { method: 'POST' });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GEMINI_API_KEY = 'k';
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 9, limit: 30, resetAfter: 600, resetAt: 0 });
});

describe('POST /api/closet-items/analyze', () => {
  it('未登入回 401', async () => {
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {} as never, user: null });
    expect((await POST(req())).status).toBe(401);
  });

  it('沒設 Gemini 回 503', async () => {
    delete process.env.GEMINI_API_KEY;
    loggedIn([]);
    expect((await POST(req())).status).toBe(503);
  });

  it('補辨識：預設名稱換成 AI 名稱，使用者取的名稱與類別不動', async () => {
    const { updates } = loggedIn(
      [
        { id: 'a', name: '未命名衣物', category: 'uncategorized', image_url: 'u1/a.png' },
        { id: 'b', name: '媽媽送的', category: 'outerwear', image_url: 'u1/b.png' },
      ],
      4
    );
    vi.mocked(tagClosetItem).mockResolvedValue(attrs);

    const res = await POST(req());
    expect(await res.json()).toEqual({ analyzed: 2, failed: 0, remaining: 4 });
    const byId = Object.fromEntries(updates.map((u) => [u.id, u.values]));
    expect(byId.a).toMatchObject({ name: '白色襯衫', category: 'top', attributes: attrs });
    expect(byId.b).toMatchObject({ name: '媽媽送的', category: 'outerwear', attributes: attrs });
  });

  it('辨識失敗的不更新，算在 failed', async () => {
    const { updates } = loggedIn([{ id: 'a', name: '未命名衣物', category: 'uncategorized', image_url: 'u1/a.png' }], 1);
    vi.mocked(tagClosetItem).mockResolvedValue(null);
    expect(await (await POST(req())).json()).toEqual({ analyzed: 0, failed: 1, remaining: 1 });
    expect(updates).toHaveLength(0);
  });
});
