import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { deleteUser } = vi.hoisted(() => ({ deleteUser: vi.fn() }));

vi.mock('@/lib/supabase/server', () => ({ getSupabaseAndUser: vi.fn() }));
vi.mock('@/lib/rateLimit', () => ({ checkRateLimit: vi.fn() }));
vi.mock('@/lib/supabaseClient', () => ({ getSupabaseAdmin: () => ({ auth: { admin: { deleteUser } } }) }));

import { DELETE } from './route';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';

function del(body?: unknown) {
  return new NextRequest('http://localhost/api/account', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** 模擬本人的 client：storage 有 files 個檔案，資料表刪除可指定失敗 */
function loggedIn({ files = 0, tableError = null as string | null, listError = null as string | null } = {}) {
  let remaining = Array.from({ length: files }, (_, i) => ({ name: `${i}.jpg` }));
  const list = vi.fn(async (_prefix: string, { limit }: { limit: number }) =>
    listError ? { data: null, error: { message: listError } } : { data: remaining.slice(0, limit), error: null }
  );
  const remove = vi.fn(async (paths: string[]) => {
    remaining = remaining.filter((f) => !paths.includes(`u1/${f.name}`));
    return { error: null };
  });
  const eq = vi.fn(async () => ({ error: tableError ? { message: tableError } : null }));
  const from = vi.fn((_table: string) => ({ delete: () => ({ eq }) }));
  const signOut = vi.fn().mockResolvedValue({ error: null });
  const supabase = { from, storage: { from: () => ({ list, remove }) }, auth: { signOut } };
  vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: supabase as never, user: { id: 'u1' } as never });
  return { list, remove, from, eq, signOut };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
  deleteUser.mockResolvedValue({ error: null });
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 2, limit: 3, resetAfter: 600, resetAt: 0 });
});

describe('DELETE /api/account', () => {
  it('未登入回 401', async () => {
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {} as never, user: null });
    const res = await DELETE(del({ confirm: 'DELETE' }));
    expect(res.status).toBe(401);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it.each([
    ['沒有 body', undefined],
    ['確認字不對', { confirm: 'yes' }],
  ])('%s 回 400、什麼都不刪', async (_label, body) => {
    const { remove, from } = loggedIn({ files: 2 });
    const res = await DELETE(del(body));
    expect(res.status).toBe(400);
    expect(remove).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('沒設 service role key 回 503，不先刪資料', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { remove } = loggedIn({ files: 1 });
    const res = await DELETE(del({ confirm: 'DELETE' }));
    expect(res.status).toBe(503);
    expect(remove).not.toHaveBeenCalled();
  });

  it('刪照片（超過一頁也全刪）、沒 cascade 的表、auth 帳號，並清 cookie', async () => {
    const { remove, from, eq, signOut } = loggedIn({ files: 1500 });
    const res = await DELETE(del({ confirm: 'DELETE' }));

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toContain('no-store');
    expect(remove).toHaveBeenCalledTimes(2);
    expect(remove.mock.calls.flatMap(([paths]) => paths)).toHaveLength(1500);
    expect(from.mock.calls.map(([t]) => t)).toEqual(['saved_outfits', 'clothing_items']);
    expect(eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(deleteUser).toHaveBeenCalledWith('u1');
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(res.headers.getSetCookie().some((c) => c.startsWith('sb-auth-status=') && c.includes('Max-Age=0'))).toBe(true);
  });

  it('列照片失敗就停，不刪帳號', async () => {
    loggedIn({ listError: 'boom' });
    const res = await DELETE(del({ confirm: 'DELETE' }));
    expect(res.status).toBe(500);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('刪資料表失敗就停，不刪帳號', async () => {
    loggedIn({ tableError: 'rls' });
    const res = await DELETE(del({ confirm: 'DELETE' }));
    expect(res.status).toBe(500);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('刪 auth 帳號失敗回 500、不清 cookie', async () => {
    const { signOut } = loggedIn();
    deleteUser.mockResolvedValue({ error: { message: 'nope' } });
    const res = await DELETE(del({ confirm: 'DELETE' }));
    expect(res.status).toBe(500);
    expect(signOut).not.toHaveBeenCalled();
  });
});
