import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({ getSupabaseAndUser: vi.fn() }));
vi.mock('@/lib/rateLimit', () => ({ checkRateLimit: vi.fn() }));

import { GET, POST } from './route';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1]);

/** 模擬 Storage：body 資料夾裡有 existing 這些檔名（新的在前） */
function loggedIn(existing: string[] = []) {
  let files = [...existing];
  const upload = vi.fn(async (path: string) => {
    files = [path.split('/').pop()!, ...files];
    return { error: null };
  });
  // 真的 Storage 預設照檔名排（檔名是亂數），要「新的在前」得自己帶 sortBy created_at desc；沒帶就當成舊的在前
  const list = vi.fn(async (_folder: string, opts?: { sortBy?: { column: string; order: string } }) => {
    const newestFirst = opts?.sortBy?.column === 'created_at' && opts.sortBy.order === 'desc';
    const ordered = newestFirst ? files : [...files].reverse();
    return { data: ordered.map((name) => ({ name, id: name })), error: null };
  });
  const remove = vi.fn(async (paths: string[]) => {
    files = files.filter((f) => !paths.includes(`u1/body/${f}`));
    return { error: null };
  });
  const createSignedUrl = vi.fn(async (path: string) => ({ data: { signedUrl: `https://signed/${path}` }, error: null }));
  const supabase = { storage: { from: () => ({ upload, list, remove, createSignedUrl }) } };
  vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: supabase as never, user: { id: 'u1' } as never });
  return { upload, remove, files: () => files };
}

function post(file?: File) {
  const form = new FormData();
  if (file) form.append('file', file);
  return new NextRequest('http://localhost/api/tryon/photo', { method: 'POST', body: form });
}

const get = () => new NextRequest('http://localhost/api/tryon/photo');

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 9, limit: 10, resetAfter: 600, resetAt: 0 });
});

describe('/api/tryon/photo', () => {
  it('未登入回 401', async () => {
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {} as never, user: null });
    expect((await GET(get())).status).toBe(401);
    expect((await POST(post())).status).toBe(401);
  });

  it('沒上傳過回 photo: null', async () => {
    loggedIn();
    const res = await GET(get());
    expect(await res.json()).toEqual({ photo: null });
  });

  it('有照片回最新那張的簽章網址', async () => {
    loggedIn(['new.jpg', 'old.jpg']);
    const res = await GET(get());
    expect(await res.json()).toEqual({ photo: { url: 'https://signed/u1/body/new.jpg' } });
  });

  it('上傳新照片存進 body 資料夾並刪掉舊的', async () => {
    const { upload, files } = loggedIn(['old.jpg']);
    const res = await POST(post(new File([JPEG], 'me.jpg', { type: 'image/jpeg' })));

    expect(res.status).toBe(201);
    const path = upload.mock.calls[0][0];
    expect(path).toMatch(/^u1\/body\/[\w-]+\.jpg$/);
    expect(files()).toEqual([path.split('/').pop()]);
    expect(await res.json()).toEqual({ photo: { url: `https://signed/${path}` } });
  });

  it.each([
    ['沒有檔案', undefined],
    ['格式不支援', new File([JPEG], 'a.gif', { type: 'image/gif' })],
    ['副檔名是 jpg 但內容不是圖', new File([Buffer.from('hello')], 'a.jpg', { type: 'image/jpeg' })],
  ])('%s 回 400、不上傳', async (_label, file) => {
    const { upload } = loggedIn(['old.jpg']);
    const res = await POST(post(file));
    expect(res.status).toBe(400);
    expect(upload).not.toHaveBeenCalled();
  });
});
