import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({ getSupabaseAndUser: vi.fn() }));
vi.mock('@/lib/rateLimit', () => ({ checkRateLimit: vi.fn() }));
vi.mock('../../../../lib/closet/remove-bg', () => ({ removeBackground: vi.fn(async () => null) }));
vi.mock('../../../../lib/closet/storage', async () => {
  const actual = await vi.importActual<typeof import('../../../../lib/closet/storage')>('../../../../lib/closet/storage');
  return { ...actual, uploadClosetImage: vi.fn() };
});

import { POST } from './route';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { removeBackground } from '../../../../lib/closet/remove-bg';
import { uploadClosetImage } from '../../../../lib/closet/storage';

// 最小合法 JPEG / PNG 檔頭
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);

function makeReq(fields: Record<string, string | Blob>) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  return new NextRequest('http://localhost/api/closet-items/upload', { method: 'POST', body: form });
}

const jpegFile = (bytes: Buffer = JPEG, type = 'image/jpeg') =>
  new File([new Uint8Array(bytes)], 'shirt.jpg', { type });

function makeSupabase(insertResult: { data?: unknown; error?: { message: string } | null }) {
  const remove = vi.fn().mockResolvedValue({ data: null, error: null });
  const single = vi.fn().mockResolvedValue({ data: insertResult.data ?? null, error: insertResult.error ?? null });
  const insert = vi.fn().mockReturnValue({ select: () => ({ single }) });
  return {
    client: { from: () => ({ insert }), storage: { from: () => ({ remove }) } },
    insert,
    remove,
  };
}

function loggedIn(client: unknown = {}) {
  vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: client as never, user: { id: 'u1' } as never });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 9, limit: 10, resetAfter: 600, resetAt: 0 });
  vi.mocked(removeBackground).mockResolvedValue(null);
  vi.mocked(uploadClosetImage).mockResolvedValue({
    filePath: 'u1/abc.jpg',
    signedUrl: 'https://p.supabase.co/storage/v1/object/sign/closet-images/u1/abc.jpg?token=x',
    expiresAt: '2026-01-01T00:00:00.000Z',
  });
});

describe('POST /api/closet-items/upload', () => {
  it('未登入回 401', async () => {
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {} as never, user: null });
    const res = await POST(makeReq({ file: jpegFile() }));
    expect(res.status).toBe(401);
  });

  it('限流回 429 並帶 Retry-After', async () => {
    loggedIn();
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0, limit: 10, resetAfter: 120, resetAt: 0, retryAfter: 120 });
    const res = await POST(makeReq({ file: jpegFile() }));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('120');
    expect(uploadClosetImage).not.toHaveBeenCalled();
  });

  it('沒有檔案回 400', async () => {
    loggedIn();
    const res = await POST(makeReq({ name: '白T' }));
    expect(res.status).toBe(400);
  });

  it('不支援的格式回 400', async () => {
    loggedIn();
    const res = await POST(makeReq({ file: jpegFile(JPEG, 'image/gif') }));
    expect(res.status).toBe(400);
    expect(uploadClosetImage).not.toHaveBeenCalled();
  });

  it('副檔名是 jpg 但內容不是圖檔回 400', async () => {
    loggedIn();
    const res = await POST(makeReq({ file: jpegFile(Buffer.from('not an image at all')) }));
    expect(res.status).toBe(400);
    expect(removeBackground).not.toHaveBeenCalled();
    expect(uploadClosetImage).not.toHaveBeenCalled();
  });

  it('類別不在清單內回 400', async () => {
    loggedIn();
    const res = await POST(makeReq({ file: jpegFile(), category: 'hat' }));
    expect(res.status).toBe(400);
  });

  it('成功：存進 closet_items，沒填名稱/類別時用預設值', async () => {
    const sb = makeSupabase({ data: { id: 'item-1', name: '未命名衣物' } });
    loggedIn(sb.client);

    const res = await POST(makeReq({ file: jpegFile() }));

    expect(res.status).toBe(201);
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    expect(uploadClosetImage).toHaveBeenCalledWith(sb.client, 'u1', JPEG, 'image/jpeg');
    expect(sb.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        name: '未命名衣物',
        category: 'uncategorized',
        image_url: expect.stringContaining('closet-images/u1/abc.jpg'),
      })
    );
  });

  it('有去背就存去背後的 PNG', async () => {
    const sb = makeSupabase({ data: { id: 'item-1' } });
    loggedIn(sb.client);
    vi.mocked(removeBackground).mockResolvedValue({ buffer: PNG, contentType: 'image/png' });

    const res = await POST(makeReq({ file: jpegFile(), name: '牛仔褲', category: 'bottom' }));

    expect(res.status).toBe(201);
    expect(uploadClosetImage).toHaveBeenCalledWith(sb.client, 'u1', PNG, 'image/png');
    expect(sb.insert).toHaveBeenCalledWith(expect.objectContaining({ name: '牛仔褲', category: 'bottom' }));
  });

  it('寫 DB 失敗時刪掉剛上傳的圖並回 500', async () => {
    const sb = makeSupabase({ error: { message: 'db down' } });
    loggedIn(sb.client);

    const res = await POST(makeReq({ file: jpegFile() }));

    expect(res.status).toBe(500);
    expect(sb.remove).toHaveBeenCalledWith(['u1/abc.jpg']);
  });
});
