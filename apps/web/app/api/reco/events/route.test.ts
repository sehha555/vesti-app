import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({ getSupabaseAndUser: vi.fn() }));
vi.mock('@/lib/rateLimit', () => ({ checkRateLimit: vi.fn() }));

import { POST } from './route';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';

function post(body: unknown) {
  return new NextRequest('http://localhost/api/reco/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function loggedIn(result: { error?: { message: string } | null } = {}) {
  const insert = vi.fn().mockResolvedValue({ error: result.error ?? null });
  const from = vi.fn(() => ({ insert }));
  vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: { from } as never, user: { id: 'u1' } as never });
  return { insert, from };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 99, limit: 120, resetAfter: 60, resetAt: 0 });
});

describe('POST /api/reco/events', () => {
  it('未登入回 401', async () => {
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {} as never, user: null });
    const res = await POST(post({ action: 'choose', itemIds: [A] }));
    expect(res.status).toBe(401);
  });

  it('限流回 429', async () => {
    loggedIn();
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0, limit: 120, resetAfter: 30, resetAt: 0, retryAfter: 30 });
    const res = await POST(post({ action: 'choose', itemIds: [A] }));
    expect(res.status).toBe(429);
  });

  it.each([
    ['未知 action', { action: 'buy', itemIds: [A] }],
    ['沒有單品', { action: 'choose', itemIds: [] }],
    ['單品 id 不是 uuid', { action: 'choose', itemIds: ['1'] }],
    ['未知原因', { action: 'dislike', itemIds: [A], reasons: ['ugly'] }],
    ['舊版 gap-fill 格式', { userId: 'x', eventType: 'ADD_TO_CART', payload: {} }],
  ])('%s 回 400', async (_label, body) => {
    const { insert } = loggedIn();
    const res = await POST(post(body));
    expect(res.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it('記錄「不要」與原因，用 session userId、單品排序成 key', async () => {
    const { insert, from } = loggedIn();
    const res = await POST(
      post({
        userId: 'attacker',
        action: 'dislike',
        itemIds: [B, A, B],
        reasons: ['color', 'weather', 'color'],
        context: { date: '2026-09-25', styleName: '休閒' },
      })
    );
    expect(res.status).toBe(201);
    expect(from).toHaveBeenCalledWith('outfit_feedback');
    expect(insert).toHaveBeenCalledWith({
      user_id: 'u1',
      action: 'dislike',
      outfit_key: `${A}|${B}`,
      item_ids: [B, A],
      reasons: ['color', 'weather'],
      context: { date: '2026-09-25', styleName: '休閒' },
    });
  });

  it('非「不要」的事件不存原因', async () => {
    const { insert } = loggedIn();
    await POST(post({ action: 'choose', itemIds: [A], reasons: ['color'] }));
    expect(insert.mock.calls[0][0]).toMatchObject({ action: 'choose', reasons: [] });
  });

  it('寫入失敗回 500', async () => {
    loggedIn({ error: { message: 'boom' } });
    const res = await POST(post({ action: 'skip', itemIds: [A] }));
    expect(res.status).toBe(500);
  });
});
