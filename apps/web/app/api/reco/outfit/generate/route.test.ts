import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST, GET } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { requireBffAuthMock } from '../../vitest.setup';

import { requireBffAuth } from '../../../../_middleware/auth';

// Helper to create NextRequest with JSON body
const createRequest = (body: unknown): NextRequest => {
  return new NextRequest('http://localhost:3000/api/reco/outfit/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'test-api-key',
    },
    body: JSON.stringify(body),
  });
};

// Setup auth mock
beforeEach(() => {
  vi.clearAllMocks();
  // Default: auth passes
  vi.mocked(requireBffAuth).mockResolvedValue({
    authorized: true,
    userId: 'test-user-id',
  });
});

describe('POST /api/reco/outfit/generate', () => {
  describe('BFF Authentication', () => {
    it('should return 401 when authentication fails (no API key)', async () => {
      vi.mocked(requireBffAuth).mockResolvedValue({
        authorized: false,
        error: NextResponse.json(
          { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
          { status: 401 }
        ),
      });

      const req = createRequest({ occasion: 'casual' });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.code).toBe('AUTH_REQUIRED');
    });

    it('should return 401 when user session is invalid', async () => {
      vi.mocked(requireBffAuth).mockResolvedValue({
        authorized: false,
        error: NextResponse.json(
          { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
          { status: 401 }
        ),
      });

      const req = createRequest({ occasion: 'work' });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.code).toBe('AUTH_REQUIRED');
    });

    it('should not expose sensitive auth details in 401 response', async () => {
      vi.mocked(requireBffAuth).mockResolvedValue({
        authorized: false,
        error: NextResponse.json(
          { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
          { status: 401 }
        ),
      });

      const req = createRequest({});
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      const responseStr = JSON.stringify(data);
      expect(responseStr).not.toContain('Supabase');
      expect(responseStr).not.toContain('VESTI_INTERNAL_API_KEY');
      expect(responseStr).not.toContain('session');
      expect(responseStr).not.toContain('API_KEY');
    });

    it('should call requireBffAuth with the request', async () => {
      const req = createRequest({ occasion: 'casual' });
      await POST(req);

      expect(requireBffAuth).toHaveBeenCalledTimes(1);
      expect(requireBffAuth).toHaveBeenCalledWith(req);
    });
  });

  describe('Happy Path (authenticated)', () => {
    it('should return 200 with generated outfits', async () => {
      const req = createRequest({
        occasion: 'casual',
        weather: { temperature: 20, condition: 'sunny' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(Array.isArray(data.outfits)).toBe(true);
      expect(data.outfits.length).toBeGreaterThan(0);
    });

    it('should return outfits with required fields', async () => {
      const req = createRequest({ occasion: 'formal' });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      const outfit = data.outfits[0];
      expect(outfit.id).toBeDefined();
      expect(outfit.items).toBeDefined();
      expect(outfit.score).toBeDefined();
      expect(outfit.reasons).toBeDefined();
    });

    it('should accept preferences in request', async () => {
      const req = createRequest({
        occasion: 'work',
        preferences: {
          styles: ['minimal', 'professional'],
          colors: ['black', 'white'],
          excludeItemIds: ['item-1'],
        },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for invalid JSON body', async () => {
      const req = new NextRequest('http://localhost:3000/api/reco/outfit/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Invalid JSON body');
      expect(data.code).toBe('INVALID_JSON');
    });
  });
});

describe('GET /api/reco/outfit/generate', () => {
  it('should return 405 Method Not Allowed', async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(405);
    expect(data.error).toBe('Method not allowed. Use POST.');
  });
});
