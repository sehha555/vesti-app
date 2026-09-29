import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({ getSupabaseAndUser: vi.fn() }));

import { POST } from './route';
import { getSupabaseAndUser } from '@/lib/supabase/server';

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

function makeReq(fields: Record<string, string>) {
  const form = new FormData();
  form.append('file', new File([JPEG], 'photo.jpg', { type: 'image/jpeg' }));
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  return new NextRequest('http://localhost/api/closet-items/upload', { method: 'POST', body: form });
}

function mockSupabase() {
  const insert = vi.fn().mockReturnValue({
    select: () => ({ single: vi.fn().mockResolvedValue({ data: { id: 'item-1' }, error: null }) }),
  });
  const storage = {
    upload: vi.fn().mockResolvedValue({ error: null }),
    createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed/url' }, error: null }),
    remove: vi.fn(),
  };
  vi.mocked(getSupabaseAndUser).mockResolvedValue({
    supabase: { from: () => ({ insert }), storage: { from: () => storage } },
    user: { id: 'u1' },
  } as never);
  return { insert };
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.REMOVE_BG_API_KEY;
});

describe('POST /api/closet-items/upload', () => {
  it('只帶必填欄位（name、category）也能存', async () => {
    const { insert } = mockSupabase();
    const res = await POST(makeReq({ name: '黑色牛仔褲', category: 'bottom' }));
    expect(res.status).toBe(201);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: '黑色牛仔褲', category: 'bottom', status: 'ACTIVE', is_archived: false, tags: [] })
    );
  });

  it('帶選填欄位時照存', async () => {
    const { insert } = mockSupabase();
    const res = await POST(makeReq({ name: 'T', category: 'top', brand: "Levi's", tags: '["休閒"]' }));
    expect(res.status).toBe(201);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ brand: "Levi's", tags: ['休閒'] }));
  });

  it('缺必填欄位回 400', async () => {
    mockSupabase();
    const res = await POST(makeReq({ category: 'top' }));
    expect(res.status).toBe(400);
  });
});
