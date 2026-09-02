import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({ getSupabaseAndUser: vi.fn() }));
vi.mock('@/lib/rateLimit', () => ({ checkRateLimit: vi.fn() }));
vi.mock('../../../../lib/http/safe-fetch', async () => {
  const actual = await vi.importActual<typeof import('../../../../lib/http/safe-fetch')>('../../../../lib/http/safe-fetch');
  return { ...actual, safeFetch: vi.fn() };
});
vi.mock('../../../../lib/closet/remove-bg', () => ({ removeBackground: vi.fn(async () => null) }));
vi.mock('../../../../lib/closet/pick-flat-image', () => ({
  pickFlatImage: vi.fn(async (candidates: { url: string }[]) => candidates[0]),
}));
vi.mock('../../../../lib/closet/storage', async () => {
  const actual = await vi.importActual<typeof import('../../../../lib/closet/storage')>('../../../../lib/closet/storage');
  return { ...actual, uploadClosetImage: vi.fn() };
});

import { POST } from './route';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { safeFetch, SafeFetchError } from '../../../../lib/http/safe-fetch';
import { uploadClosetImage } from '../../../../lib/closet/storage';
import { pickFlatImage } from '../../../../lib/closet/pick-flat-image';

// 最小合法 JPEG 檔頭（FF D8 FF）+ 一點內容
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

const html = (image: string | null, title = '商品') =>
  `<html><head>${title ? `<meta property="og:title" content="${title}">` : ''}${
    image ? `<meta property="og:image" content="${image}">` : ''
  }</head></html>`;

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/closet-items/from-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

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

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 9, limit: 10, resetAfter: 600, resetAt: 0 });
  vi.mocked(uploadClosetImage).mockResolvedValue({
    filePath: 'u1/abc.jpg',
    signedUrl: 'https://p.supabase.co/storage/v1/object/sign/closet-images/u1/abc.jpg?token=x',
    expiresAt: '2026-01-01T00:00:00.000Z',
  });
});

describe('POST /api/closet-items/from-url', () => {
  it('未登入回 401', async () => {
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {} as never, user: null });
    const res = await POST(makeReq({ url: 'https://shop.example/p/1' }));
    expect(res.status).toBe(401);
  });

  it('限流回 429 並帶 Retry-After', async () => {
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {} as never, user: { id: 'u1' } as never });
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0, limit: 10, resetAfter: 120, resetAt: 0, retryAfter: 120 });
    const res = await POST(makeReq({ url: 'https://shop.example/p/1' }));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('120');
    expect(safeFetch).not.toHaveBeenCalled();
  });

  it('網址格式不對回 400', async () => {
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {} as never, user: { id: 'u1' } as never });
    const res = await POST(makeReq({ url: 'not-a-url' }));
    expect(res.status).toBe(400);
  });

  it('被 SSRF 防護擋下回 400，不會去抓圖', async () => {
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {} as never, user: { id: 'u1' } as never });
    vi.mocked(safeFetch).mockRejectedValueOnce(new SafeFetchError('blocked', 'BLOCKED'));
    const res = await POST(makeReq({ url: 'https://169.254.169.254/' }));
    expect(res.status).toBe(400);
    expect(safeFetch).toHaveBeenCalledTimes(1);
  });

  it('頁面沒有 og:image 回 422', async () => {
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {} as never, user: { id: 'u1' } as never });
    vi.mocked(safeFetch).mockResolvedValueOnce({ buffer: Buffer.from(html(null)), contentType: 'text/html', finalUrl: 'https://shop.example/p/1' });
    const res = await POST(makeReq({ url: 'https://shop.example/p/1' }));
    expect(res.status).toBe(422);
    expect((await res.json()).error).toContain('拍照');
  });

  it('圖片 magic bytes 不符回 422，不寫 DB', async () => {
    const sb = makeSupabase({});
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: sb.client as never, user: { id: 'u1' } as never });
    vi.mocked(safeFetch)
      .mockResolvedValueOnce({ buffer: Buffer.from(html('https://cdn.example/a.jpg')), contentType: 'text/html', finalUrl: 'https://shop.example/p/1' })
      .mockResolvedValueOnce({ buffer: Buffer.from('not an image'), contentType: 'image/jpeg', finalUrl: 'https://cdn.example/a.jpg' });
    const res = await POST(makeReq({ url: 'https://shop.example/p/1' }));
    expect(res.status).toBe(422);
    expect(sb.insert).not.toHaveBeenCalled();
  });

  it('成功：201，名稱取 og:title，category 預設 uncategorized，記 source_url', async () => {
    const sb = makeSupabase({ data: { id: 'i1', name: '商品', category: 'uncategorized' } });
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: sb.client as never, user: { id: 'u1' } as never });
    vi.mocked(safeFetch)
      .mockResolvedValueOnce({ buffer: Buffer.from(html('https://cdn.example/a.jpg')), contentType: 'text/html', finalUrl: 'https://shop.example/p/1' })
      .mockResolvedValueOnce({ buffer: JPEG, contentType: 'image/jpeg', finalUrl: 'https://cdn.example/a.jpg' });

    const res = await POST(makeReq({ url: 'https://shop.example/p/1' }));
    expect(res.status).toBe(201);
    expect(uploadClosetImage).toHaveBeenCalledWith(sb.client, 'u1', JPEG, 'image/jpeg');
    expect(sb.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1', name: '商品', category: 'uncategorized', source_url: 'https://shop.example/p/1' })
    );
    const body = await res.json();
    expect(body.data.id).toBe('i1');
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('貼的是圖片網址：只抓一次，直接存，名稱退回未命名商品', async () => {
    const sb = makeSupabase({ data: { id: 'i2' } });
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: sb.client as never, user: { id: 'u1' } as never });
    vi.mocked(safeFetch).mockResolvedValueOnce({ buffer: JPEG, contentType: 'image/jpeg', finalUrl: 'https://cdn.example/x.jpg' });

    const res = await POST(makeReq({ url: 'https://cdn.example/x.jpg' }));
    expect(res.status).toBe(201);
    expect(safeFetch).toHaveBeenCalledTimes(1);
    expect(uploadClosetImage).toHaveBeenCalledWith(sb.client, 'u1', JPEG, 'image/jpeg');
    expect(sb.insert).toHaveBeenCalledWith(expect.objectContaining({ name: '未命名商品', source_url: 'https://cdn.example/x.jpg' }));
  });

  it('UNIQLO 台灣商品頁：不抓頁面，抓 4 張候選圖交給模型挑', async () => {
    const sb = makeSupabase({ data: { id: 'i3' } });
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: sb.client as never, user: { id: 'u1' } as never });
    vi.mocked(safeFetch).mockResolvedValue({ buffer: JPEG, contentType: 'image/jpeg', finalUrl: 'x' });

    const page = 'https://www.uniqlo.com/tw/zh_TW/product-detail.html?productCode=u0000000054525';
    const res = await POST(makeReq({ url: page, name: 'AIRism T' }));
    expect(res.status).toBe(201);
    expect(safeFetch).toHaveBeenCalledTimes(4);
    expect(vi.mocked(safeFetch).mock.calls[0][0]).toBe('https://www.uniqlo.com/tw/hmall/test/u0000000054525/main/first/1000/1.jpg');
    expect(vi.mocked(pickFlatImage).mock.calls[0][0]).toHaveLength(4);
    expect(sb.insert).toHaveBeenCalledWith(expect.objectContaining({ name: 'AIRism T', source_url: page }));
  });

  it('UNIQLO 候選圖全部抓不到時回 422', async () => {
    const sb = makeSupabase({ data: { id: 'i4' } });
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: sb.client as never, user: { id: 'u1' } as never });
    vi.mocked(safeFetch).mockRejectedValue(new SafeFetchError('not found', 'HTTP'));

    const res = await POST(makeReq({ url: 'https://www.uniqlo.com/tw/zh_TW/product-detail.html?productCode=u0000000054525' }));
    expect(res.status).toBe(422);
    expect(sb.insert).not.toHaveBeenCalled();
  });

  it('使用者給的 name / category 優先於 og', async () => {
    const sb = makeSupabase({ data: { id: 'i2' } });
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: sb.client as never, user: { id: 'u1' } as never });
    vi.mocked(safeFetch)
      .mockResolvedValueOnce({ buffer: Buffer.from(html('https://cdn.example/a.jpg')), contentType: 'text/html', finalUrl: 'https://shop.example/p/1' })
      .mockResolvedValueOnce({ buffer: JPEG, contentType: 'image/jpeg', finalUrl: 'https://cdn.example/a.jpg' });
    await POST(makeReq({ url: 'https://shop.example/p/1', name: '我的外套', category: 'outerwear' }));
    expect(sb.insert).toHaveBeenCalledWith(expect.objectContaining({ name: '我的外套', category: 'outerwear' }));
  });

  it('DB 寫入失敗時刪掉已上傳的圖並回 500', async () => {
    const sb = makeSupabase({ error: { message: 'boom' } });
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: sb.client as never, user: { id: 'u1' } as never });
    vi.mocked(safeFetch)
      .mockResolvedValueOnce({ buffer: Buffer.from(html('https://cdn.example/a.jpg')), contentType: 'text/html', finalUrl: 'https://shop.example/p/1' })
      .mockResolvedValueOnce({ buffer: JPEG, contentType: 'image/jpeg', finalUrl: 'https://cdn.example/a.jpg' });
    const res = await POST(makeReq({ url: 'https://shop.example/p/1' }));
    expect(res.status).toBe(500);
    expect(sb.remove).toHaveBeenCalledWith(['u1/abc.jpg']);
  });
});
