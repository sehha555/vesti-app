import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getSupabaseAndUser } from '../../../lib/supabase/server';

vi.mock('../../../lib/supabase/server', () => ({
  getSupabaseAndUser: vi.fn(),
}));

// 全域 vitest.setup 把 _middleware/auth 整個 mock 掉給 route 測試用；這裡要測真實實作
const { requireBffAuth, requireUserAuth } =
  await vi.importActual<typeof import('./auth')>('./auth');

const API_KEY = 'test-internal-key';

const makeReq = (apiKey?: string) =>
  new NextRequest('http://localhost:3000/api/x', {
    headers: apiKey ? { 'x-api-key': apiKey } : {},
  });

const mockUser = (id: string | null) => {
  vi.mocked(getSupabaseAndUser).mockResolvedValue({
    supabase: {} as never,
    user: id ? ({ id } as never) : null,
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.INTERNAL_API_KEY = API_KEY;
});

describe('requireBffAuth', () => {
  it('API key 錯誤時回 401 INVALID_API_KEY，且不查 session', async () => {
    mockUser('u1');
    const result = await requireBffAuth(makeReq('wrong'));
    expect(result.authorized).toBe(false);
    expect(result.error?.status).toBe(401);
    expect((await result.error!.json()).code).toBe('INVALID_API_KEY');
    expect(getSupabaseAndUser).not.toHaveBeenCalled();
  });

  it('API key 正確但無 session 時回 401 INVALID_SESSION', async () => {
    mockUser(null);
    const result = await requireBffAuth(makeReq(API_KEY));
    expect(result.authorized).toBe(false);
    expect((await result.error!.json()).code).toBe('INVALID_SESSION');
  });

  it('API key 與 session 都正確時回傳 Supabase 驗證後的 user id', async () => {
    mockUser('user-from-supabase');
    const result = await requireBffAuth(makeReq(API_KEY));
    expect(result).toEqual({ authorized: true, userId: 'user-from-supabase' });
  });

  it('session 驗證拋錯時回 500 AUTH_ERROR', async () => {
    vi.mocked(getSupabaseAndUser).mockRejectedValue(new Error('boom'));
    const result = await requireBffAuth(makeReq(API_KEY));
    expect(result.error?.status).toBe(500);
  });
});

describe('requireUserAuth', () => {
  it('無 session 時回 401，不再是永遠通過的 stub', async () => {
    mockUser(null);
    const result = await requireUserAuth(makeReq());
    expect(result.authorized).toBe(false);
    expect(result.error?.status).toBe(401);
    expect(result.userId).toBeUndefined();
  });

  it('有 session 時 userId 與 id 都是驗證後的 user id', async () => {
    mockUser('u2');
    const result = await requireUserAuth(makeReq());
    expect(result).toEqual({ authorized: true, userId: 'u2', id: 'u2' });
  });
});
