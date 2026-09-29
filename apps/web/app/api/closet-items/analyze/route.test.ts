import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({ getSupabaseAndUser: vi.fn() }));
vi.mock('@/lib/rateLimit', () => ({ checkRateLimit: vi.fn() }));
vi.mock('../../../../lib/closet/analyze-clothing', () => ({ analyzeClothingImage: vi.fn() }));

import { POST } from './route';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { analyzeClothingImage } from '../../../../lib/closet/analyze-clothing';

// 最小合法 JPEG 檔頭（FF D8 FF）+ 一點內容
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

function makeReq(file?: { bytes: Buffer; type: string }) {
  const form = new FormData();
  if (file) form.append('file', new File([new Uint8Array(file.bytes)], 'photo', { type: file.type }));
  return new NextRequest('http://localhost/api/closet-items/analyze', { method: 'POST', body: form });
}

const ANALYSIS = { name: '黑色連帽外套', category: 'outerwear', color: '黑色', brand: null, tags: ['休閒'] };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {}, user: { id: 'u1' } } as never);
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 19, limit: 20, resetAfter: 600, resetAt: 0 });
  vi.mocked(analyzeClothingImage).mockResolvedValue(ANALYSIS as never);
});

describe('POST /api/closet-items/analyze', () => {
  it('沒登入回 401', async () => {
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {}, user: null } as never);
    const res = await POST(makeReq({ bytes: JPEG, type: 'image/jpeg' }));
    expect(res.status).toBe(401);
  });

  it('超過頻率回 429', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0, limit: 20, resetAfter: 60, resetAt: 0 });
    const res = await POST(makeReq({ bytes: JPEG, type: 'image/jpeg' }));
    expect(res.status).toBe(429);
  });

  it('沒附檔案回 400', async () => {
    const res = await POST(makeReq());
    expect(res.status).toBe(400);
  });

  it('不支援的格式回 400，不叫模型', async () => {
    const res = await POST(makeReq({ bytes: JPEG, type: 'image/gif' }));
    expect(res.status).toBe(400);
    expect(analyzeClothingImage).not.toHaveBeenCalled();
  });

  it('宣稱 JPEG 但檔頭不符回 400，不叫模型', async () => {
    const res = await POST(makeReq({ bytes: Buffer.from('not an image'), type: 'image/jpeg' }));
    expect(res.status).toBe(400);
    expect(analyzeClothingImage).not.toHaveBeenCalled();
  });

  it('成功回分析結果', async () => {
    const res = await POST(makeReq({ bytes: JPEG, type: 'image/jpeg' }));
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual(ANALYSIS);
    expect(analyzeClothingImage).toHaveBeenCalledWith(expect.any(Buffer), 'image/jpeg');
  });

  it('模型出錯回 502', async () => {
    vi.mocked(analyzeClothingImage).mockRejectedValue(new Error('503 overloaded'));
    const res = await POST(makeReq({ bytes: JPEG, type: 'image/jpeg' }));
    expect(res.status).toBe(502);
  });
});
