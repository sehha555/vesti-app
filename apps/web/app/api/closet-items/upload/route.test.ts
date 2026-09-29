import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({ getSupabaseAndUser: vi.fn() }));
vi.mock('../../../../lib/closet/remove-bg', () => ({ removeBackground: vi.fn() }));

import { POST } from './route';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { removeBackground } from '../../../../lib/closet/remove-bg';

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
  return { insert, storage };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(removeBackground).mockResolvedValue(null);
});

describe('POST /api/closet-items/upload', () => {
  it('只帶必填欄位（name、category）也能存', async () => {
    const { insert } = mockSupabase();
    const res = await POST(makeReq({ name: '黑色牛仔褲', category: 'bottom' }));
    expect(res.status).toBe(201);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: '黑色牛仔褲', category: 'bottom', status: 'ACTIVE', is_archived: false, tags: [], source_type: 'UPLOAD' })
    );
  });

  it('帶選填欄位時照存', async () => {
    const { insert } = mockSupabase();
    const res = await POST(makeReq({ name: 'T', category: 'top', brand: "Levi's", tags: '["休閒"]' }));
    expect(res.status).toBe(201);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ brand: "Levi's", tags: ['休閒'] }));
  });

  it('去背成功時存去背後的 PNG', async () => {
    const { storage } = mockSupabase();
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    vi.mocked(removeBackground).mockResolvedValue({ buffer: png, contentType: 'image/png' });
    const res = await POST(makeReq({ name: 'T', category: 'top' }));
    expect(res.status).toBe(201);
    expect(storage.upload).toHaveBeenCalledTimes(1);
    const [path, body, opts] = storage.upload.mock.calls[0];
    expect(path).toMatch(/^u1\/.+\.png$/);
    expect(body).toBe(png);
    expect(opts).toEqual(expect.objectContaining({ contentType: 'image/png' }));
  });

  it('沒去背（沒 key 或失敗）時存原圖', async () => {
    const { storage } = mockSupabase();
    const res = await POST(makeReq({ name: 'T', category: 'top' }));
    expect(res.status).toBe(201);
    const [path, , opts] = storage.upload.mock.calls[0];
    expect(path).toMatch(/^u1\/.+\.jpg$/);
    expect(opts).toEqual(expect.objectContaining({ contentType: 'image/jpeg' }));
  });

  it('外部訂單帶訂單編號時照存', async () => {
    const { insert } = mockSupabase();
    const res = await POST(makeReq({ name: 'T', category: 'top', source_type: 'EXTERNAL_ORDER', source_ref_id: '2409ABC' }));
    expect(res.status).toBe(201);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ source_type: 'EXTERNAL_ORDER', source_ref_id: '2409ABC' }));
  });

  it('不開放的來源或拍照上傳帶訂單編號回 400', async () => {
    mockSupabase();
    expect((await POST(makeReq({ name: 'T', category: 'top', source_type: 'IN_APP_PURCHASE' }))).status).toBe(400);
    expect((await POST(makeReq({ name: 'T', category: 'top', source_ref_id: 'x' }))).status).toBe(400);
  });

  it('缺必填欄位回 400', async () => {
    mockSupabase();
    const res = await POST(makeReq({ category: 'top' }));
    expect(res.status).toBe(400);
  });
});
