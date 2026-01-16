import { describe, it, expect, afterEach, vi } from 'vitest';
import { POST, GET } from './route';
import { NextRequest } from 'next/server';
import * as supabaseServer from '../../../lib/supabase/server';

const UUID_MOCK = '550e8400-e29b-41d4-a716-446655440000';

describe('POST /api/outfits - Legacy Payload Env Flag', () => {
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
    expect(body.error).toBeDefined();
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

  it('should return 200 with only user own outfits when GET authenticated', async () => {
    const userA = { id: UUID_MOCK };
    const userB = { id: '660e8400-e29b-41d4-a716-446655440000' };

    // Create outfit for userA
    vi.spyOn(supabaseServer, 'getSupabaseAndUser').mockResolvedValue({
      user: userA as any,
      supabase: {} as any,
    });

    const outfitAPayload = { userId: userA.id, name: 'outfit A', itemIds: [UUID_MOCK] };
    const reqA = new NextRequest(new URL('http://localhost:3000/api/outfits'), {
      method: 'POST',
      body: JSON.stringify(outfitAPayload),
      headers: { 'Content-Type': 'application/json' },
    });

    const responseA = await POST(reqA);
    expect(responseA.status).toBe(201);

    // Create outfit for userB
    vi.spyOn(supabaseServer, 'getSupabaseAndUser').mockResolvedValue({
      user: userB as any,
      supabase: {} as any,
    });

    const outfitBPayload = { userId: userB.id, name: 'outfit B', itemIds: [UUID_MOCK] };
    const reqB = new NextRequest(new URL('http://localhost:3000/api/outfits'), {
      method: 'POST',
      body: JSON.stringify(outfitBPayload),
      headers: { 'Content-Type': 'application/json' },
    });

    const responseB = await POST(reqB);
    expect(responseB.status).toBe(201);

    // Get outfits as userA
    vi.spyOn(supabaseServer, 'getSupabaseAndUser').mockResolvedValue({
      user: userA as any,
      supabase: {} as any,
    });

    const reqGet = new NextRequest(new URL('http://localhost:3000/api/outfits'), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const responseGet = await GET(reqGet);
    expect(responseGet.status).toBe(200);

    const responseHeaders = Object.fromEntries(responseGet.headers);
    expect(responseHeaders['cache-control']).toBe('private, no-store');

    const outfits = await responseGet.json();
    // Verify all returned outfits belong to userA
    if (Array.isArray(outfits)) {
      outfits.forEach((outfit: any) => {
        expect(outfit.userId).toBe(userA.id);
      });
    }
  });
});
