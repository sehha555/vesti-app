import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({ getSupabaseAndUser: vi.fn() }));
vi.mock('@/lib/rateLimit', () => ({ checkRateLimit: vi.fn() }));
vi.mock('../../../../lib/closet/analyze-order', () => ({ analyzeOrderScreenshot: vi.fn() }));

import { POST } from './route';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { analyzeOrderScreenshot } from '../../../../lib/closet/analyze-order';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);

function makeReq() {
  const form = new FormData();
  form.append('file', new File([PNG], 'order.png', { type: 'image/png' }));
  return new NextRequest('http://localhost/api/closet-items/analyze-order', { method: 'POST', body: form });
}

const ANALYSIS = { orderId: '2409ABC', items: [{ name: '白色 T 恤', category: 'top', color: '白色', brand: null, box: [0, 0, 100, 100] }] };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {}, user: { id: 'u1' } } as never);
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 9, limit: 10, resetAfter: 600, resetAt: 0 });
  vi.mocked(analyzeOrderScreenshot).mockResolvedValue(ANALYSIS as never);
});

describe('POST /api/closet-items/analyze-order', () => {
  it('沒登入回 401', async () => {
    vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {}, user: null } as never);
    expect((await POST(makeReq())).status).toBe(401);
  });

  it('成功回商品清單與訂單編號', async () => {
    const res = await POST(makeReq());
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual(ANALYSIS);
  });

  it('模型出錯回 502', async () => {
    vi.mocked(analyzeOrderScreenshot).mockRejectedValue(new Error('boom'));
    expect((await POST(makeReq())).status).toBe(502);
  });
});
