import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({ getSupabaseAndUser: vi.fn() }));
vi.mock('@/lib/rateLimit', () => ({ checkRateLimit: vi.fn() }));
vi.mock('@/lib/tryon/jobs', () => ({ getTryonStates: vi.fn() }));

import { GET } from './route';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getTryonStates } from '@/lib/tryon/jobs';

const ID = '0347fbe7-8125-4a65-b217-07e9d42ee4ae';
const get = (ids: string) => new NextRequest(`http://localhost/api/tryon/jobs?ids=${ids}`);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSupabaseAndUser).mockResolvedValue({ supabase: {} as never, user: { id: 'u1' } as never });
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 1, limit: 600, resetAfter: 60, resetAt: 0 });
});

describe('GET /api/tryon/jobs', () => {
  it('回本人工作的狀態', async () => {
    vi.mocked(getTryonStates).mockResolvedValue([{ jobId: ID, status: 'queued' }]);
    const res = await GET(get(ID));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ jobs: [{ jobId: ID, status: 'queued' }] });
    expect(getTryonStates).toHaveBeenCalledWith({}, 'u1', [ID]);
  });

  it.each([
    ['沒帶 ids', ''],
    ['不是 uuid', 'abc'],
    ['超過 10 個', Array(11).fill(ID).join(',')],
  ])('%s 回 400', async (_label, ids) => {
    const res = await GET(get(ids));
    expect(res.status).toBe(400);
    expect(getTryonStates).not.toHaveBeenCalled();
  });
});
