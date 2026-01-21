import { describe, it, expect, afterEach, vi } from 'vitest';
import { POST, GET } from './route';
import { NextRequest } from 'next/server';
import * as supabaseServer from '../../../lib/supabase/server';
import * as supabaseClient from '../../../lib/supabaseClient';

const UUID_MOCK = '550e8400-e29b-41d4-a716-446655440000';
const OUTFIT_ID_MOCK = '660e8400-e29b-41d4-a716-446655440001';

describe('POST /api/outfits - Supabase Integration', () => {
  const ORIGINAL_ENABLE_LEGACY = process.env.ENABLE_LEGACY_OUTFITS_PAYLOAD;

  afterEach(() => {
    vi.restoreAllMocks();
    if (ORIGINAL_ENABLE_LEGACY === undefined) {
      delete process.env.ENABLE_LEGACY_OUTFITS_PAYLOAD;
    } else {
      process.env.ENABLE_LEGACY_OUTFITS_PAYLOAD = ORIGINAL_ENABLE_LEGACY;
    }
  });

  it('should return 400 when legacy payload is used and ENABLE_LEGACY_OUTFITS_PAYLOAD="false"', async () => {
    process.env.ENABLE_LEGACY_OUTFITS_PAYLOAD = 'false';

    const mockUser = { id: UUID_MOCK };
    vi.spyOn(supabaseServer, 'getSupabaseAndUser').mockResolvedValue({
      user: mockUser as any,
      supabase: {} as any,
    });

    const legacyPayload = { name: 'test outfit', itemIds: [UUID_MOCK] };
    const req = new NextRequest(new URL('http://localhost:3000/api/outfits'), {
      method: 'POST',
      body: JSON.stringify(legacyPayload),
      headers: {
        'Content-Type': 'application/json',
        'user-agent': 'Test Browser',
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const responseHeaders = Object.fromEntries(response.headers);
    expect(responseHeaders['cache-control']).toBe('private, no-store');

    const body = await response.json();
    expect(body.error).toContain('缺少必要欄位');
  });

  it('should not call logDeprecationMetric when legacy payload is rejected by env flag', async () => {
    process.env.ENABLE_LEGACY_OUTFITS_PAYLOAD = 'false';

    const mockUser = { id: UUID_MOCK };
    vi.spyOn(supabaseServer, 'getSupabaseAndUser').mockResolvedValue({
      user: mockUser as any,
      supabase: {} as any,
    });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const legacyPayload = { name: 'test outfit', itemIds: [UUID_MOCK] };
    const req = new NextRequest(new URL('http://localhost:3000/api/outfits'), {
      method: 'POST',
      body: JSON.stringify(legacyPayload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    await POST(req);

    // Ensure logDeprecationMetric was not called (no JSON log output)
    const logCalls = consoleSpy.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('deprecation_metric')
    );
    expect(logCalls).toHaveLength(0);
  });

  it('should return 400 when legacy payload has only whitespace in name', async () => {
    process.env.ENABLE_LEGACY_OUTFITS_PAYLOAD = 'true';

    const mockUser = { id: UUID_MOCK };
    vi.spyOn(supabaseServer, 'getSupabaseAndUser').mockResolvedValue({
      user: mockUser as any,
      supabase: {} as any,
    });

    const invalidLegacyPayload = { name: '   ', itemIds: [UUID_MOCK] };
    const req = new NextRequest(new URL('http://localhost:3000/api/outfits'), {
      method: 'POST',
      body: JSON.stringify(invalidLegacyPayload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const responseHeaders = Object.fromEntries(response.headers);
    expect(responseHeaders['cache-control']).toBe('private, no-store');
  });

  it('should return 201 when legacy payload is used with authenticated session and env flag enabled', async () => {
    process.env.ENABLE_LEGACY_OUTFITS_PAYLOAD = 'true';

    const mockUser = { id: UUID_MOCK };
    vi.spyOn(supabaseServer, 'getSupabaseAndUser').mockResolvedValue({
      user: mockUser as any,
      supabase: {} as any,
    });

    // Mock supabaseAdmin insert
    const mockInsertData = {
      id: OUTFIT_ID_MOCK,
      user_id: UUID_MOCK,
      outfit_data: {
        name: 'legacy outfit',
        styleName: 'legacy outfit',
        itemIds: [UUID_MOCK],
        items: [{ id: UUID_MOCK }],
      },
      created_at: new Date().toISOString(),
      updated_at: null,
    };

    const mockSingle = vi.fn().mockResolvedValue({
      data: mockInsertData,
      error: null,
    });

    const mockSelect = vi.fn().mockReturnValue({
      single: mockSingle,
    });

    const mockInsert = vi.fn().mockReturnValue({
      select: mockSelect,
    });

    const mockFrom = vi.fn().mockReturnValue({
      insert: mockInsert,
    });

    vi.spyOn(supabaseClient, 'supabaseAdmin', 'get').mockReturnValue({
      from: mockFrom,
    } as any);

    const legacyPayload = { name: 'legacy outfit', itemIds: [UUID_MOCK] };
    const req = new NextRequest(new URL('http://localhost:3000/api/outfits'), {
      method: 'POST',
      body: JSON.stringify(legacyPayload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.userId).toBe(UUID_MOCK);
  });

  it('should return 403 when POST userId does not match authenticated user', async () => {
    process.env.ENABLE_LEGACY_OUTFITS_PAYLOAD = 'true';

    const authenticatedUserId = UUID_MOCK;
    const differentUserId = '660e8400-e29b-41d4-a716-446655440000';

    const mockUser = { id: authenticatedUserId };
    vi.spyOn(supabaseServer, 'getSupabaseAndUser').mockResolvedValue({
      user: mockUser as any,
      supabase: {} as any,
    });

    const payload = {
      userId: differentUserId,
      name: 'outfit',
      itemIds: [UUID_MOCK]
    };
    const req = new NextRequest(new URL('http://localhost:3000/api/outfits'), {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(403);

    const responseHeaders = Object.fromEntries(response.headers);
    expect(responseHeaders['cache-control']).toBe('private, no-store');

    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it('should return 401 when GET is called without authentication', async () => {
    const mockUser = null;
    vi.spyOn(supabaseServer, 'getSupabaseAndUser').mockResolvedValue({
      user: mockUser as any,
      supabase: {} as any,
    });

    const req = new NextRequest(new URL('http://localhost:3000/api/outfits'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await GET(req);
    expect(response.status).toBe(401);

    const responseHeaders = Object.fromEntries(response.headers);
    expect(responseHeaders['cache-control']).toBe('private, no-store');

    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it('should return 201 when outfit is created with Supabase', async () => {
    process.env.ENABLE_LEGACY_OUTFITS_PAYLOAD = 'true';

    const mockUser = { id: UUID_MOCK };
    vi.spyOn(supabaseServer, 'getSupabaseAndUser').mockResolvedValue({
      user: mockUser as any,
      supabase: {} as any,
    });

    // Mock supabaseAdmin.from().insert().select().single()
    const mockInsertData = {
      id: OUTFIT_ID_MOCK,
      user_id: UUID_MOCK,
      outfit_data: {
        name: 'test outfit',
        styleName: 'test outfit',
        itemIds: [UUID_MOCK],
        items: [{ id: UUID_MOCK }],
      },
      created_at: new Date().toISOString(),
      updated_at: null,
    };

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockInsertData,
          error: null,
        }),
      }),
    });

    const mockFrom = vi.fn().mockReturnValue({
      insert: mockInsert,
    });

    vi.spyOn(supabaseClient, 'supabaseAdmin', 'get').mockReturnValue({
      from: mockFrom,
    } as any);

    const payload = { name: 'test outfit', itemIds: [UUID_MOCK] };
    const req = new NextRequest(new URL('http://localhost:3000/api/outfits'), {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.id).toBe(OUTFIT_ID_MOCK);
    expect(body.name).toBe('test outfit');
    expect(body.userId).toBe(UUID_MOCK);
  });

  it('should return 200 with user only own outfits when GET authenticated', async () => {
    const userA = { id: UUID_MOCK };

    // Mock supabase client from getSupabaseAndUser
    const mockSelectData = [
      {
        id: OUTFIT_ID_MOCK,
        user_id: userA.id,
        outfit_data: {
          name: 'outfit A',
          styleName: 'outfit A',
          itemIds: [UUID_MOCK],
          items: [{ id: UUID_MOCK }],
        },
        created_at: new Date().toISOString(),
        updated_at: null,
        occasion: null,
        is_liked: false,
      },
    ];

    const mockOrderFn = vi.fn().mockResolvedValue({
      data: mockSelectData,
      error: null,
    });

    const mockEqFn = vi.fn().mockReturnValue({
      order: mockOrderFn,
    });

    const mockSelectFn = vi.fn().mockReturnValue({
      eq: mockEqFn,
    });

    const mockSupabaseClient = {
      from: vi.fn().mockReturnValue({
        select: mockSelectFn,
      }),
    };

    vi.spyOn(supabaseServer, 'getSupabaseAndUser').mockResolvedValue({
      user: userA as any,
      supabase: mockSupabaseClient as any,
    });

    const reqGet = new NextRequest(new URL('http://localhost:3000/api/outfits'), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const responseGet = await GET(reqGet);
    expect(responseGet.status).toBe(200);

    const responseHeaders = Object.fromEntries(responseGet.headers);
    expect(responseHeaders['cache-control']).toBe('private, no-store');
  });

});
