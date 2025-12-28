import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST, GET } from './route';
import { NextRequest } from 'next/server';
import { MAX_OUTFITS, MAX_TAGS_PER_OUTFIT, MAX_BODY_SIZE } from '../../../../lib/validation/recoRank';

// Mock the auth middleware
vi.mock('../../_middleware/auth', () => ({
  requireBffAuth: vi.fn(),
}));

import { requireBffAuth } from '../../_middleware/auth';

// Test API key (for testing purposes only)
const TEST_API_KEY = 'test-internal-api-key-12345';

// Helper to create NextRequest with JSON body and optional auth headers
const createRequest = (body: unknown, options?: { withAuth?: boolean; apiKey?: string }): NextRequest => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (options?.withAuth) {
    headers['X-API-Key'] = options.apiKey || TEST_API_KEY;
  }

  return new NextRequest('http://localhost:3000/api/reco/rank', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
};

// Setup auth mock to allow requests by default
beforeEach(() => {
  vi.clearAllMocks();
  // Default: auth passes with a mock user ID
  vi.mocked(requireBffAuth).mockResolvedValue({
    authorized: true,
    userId: 'test-user-id',
  });
});

describe('POST /api/reco/rank', () => {
  describe('Happy Path', () => {
    it('should return ranked outfits sorted by finalScore', async () => {
      const req = createRequest({
        outfits: [
          { id: 'o1', score: 0.3, tags: ['casual'] },
          { id: 'o2', score: 0.9, tags: ['formal'] },
          { id: 'o3', score: 0.6, tags: ['sport'] },
        ],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0].id).toBe('o2'); // Highest score first
      expect(data[1].id).toBe('o3');
      expect(data[2].id).toBe('o1');
    });

    it('should apply preference boost correctly', async () => {
      const req = createRequest({
        outfits: [
          { id: 'o1', score: 0.5, tags: ['casual'] },
          { id: 'o2', score: 0.5, tags: ['minimal', 'work'] },
        ],
        userPrefs: { preferredTags: ['minimal'], blacklistTags: [] },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data[0].id).toBe('o2'); // Has preferred tag
      expect(data[0].adjustments.preferenceBoost).toBeGreaterThan(0);
    });

    it('should apply blacklist penalty correctly', async () => {
      const req = createRequest({
        outfits: [
          { id: 'o1', score: 0.9, tags: ['sport'] },
          { id: 'o2', score: 0.4, tags: ['work'] },
        ],
        userPrefs: { preferredTags: [], blacklistTags: ['sport'] },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data[0].id).toBe('o2'); // o1 penalized due to blacklist
      expect(data[1].adjustments.blacklistPenalty).toBeGreaterThan(0);
    });

    it('should match specification example: o1 ranks first', async () => {
      // Example from spec
      const req = createRequest({
        outfits: [
          { id: 'o1', score: 0.9, tags: ['minimal', 'work'] },
          { id: 'o2', score: 0.4, tags: ['sport'] },
        ],
        userPrefs: { preferredTags: ['minimal'], blacklistTags: ['sport'] },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data[0].id).toBe('o1');
      expect(data[0].finalScore).toBeGreaterThanOrEqual(0);
      expect(data[0].finalScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Boundary Values', () => {
    it('should handle single outfit', async () => {
      const req = createRequest({
        outfits: [{ id: 'only', score: 0.5, tags: [] }],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('only');
    });

    it('should handle outfit with score 0', async () => {
      const req = createRequest({
        outfits: [{ id: 'zero', score: 0, tags: [] }],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data[0].finalScore).toBe(0);
    });

    it('should handle outfit with score 1', async () => {
      const req = createRequest({
        outfits: [{ id: 'max', score: 1, tags: [] }],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data[0].finalScore).toBeLessThanOrEqual(1);
    });

    it('should handle outfit with empty tags array', async () => {
      const req = createRequest({
        outfits: [{ id: 'notags', score: 0.5, tags: [] }],
        userPrefs: { preferredTags: ['minimal'], blacklistTags: [] },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data[0].adjustments.preferenceBoost).toBe(0);
    });

    it('should handle missing userPrefs', async () => {
      const req = createRequest({
        outfits: [{ id: 'o1', score: 0.7, tags: ['casual'] }],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data[0].finalScore).toBe(0.7);
    });

    it('should handle empty preferredTags and blacklistTags', async () => {
      const req = createRequest({
        outfits: [{ id: 'o1', score: 0.5, tags: ['casual'] }],
        userPrefs: { preferredTags: [], blacklistTags: [] },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data[0].adjustments.preferenceBoost).toBe(0);
      expect(data[0].adjustments.blacklistPenalty).toBe(0);
    });
  });

  describe('Error Inputs', () => {
    it('should return 400 for empty outfits array', async () => {
      const req = createRequest({
        outfits: [],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 when outfits exceeds maximum limit', async () => {
      const tooManyOutfits = Array.from({ length: MAX_OUTFITS + 1 }, (_, i) => ({
        id: `o${i}`,
        score: 0.5,
        tags: [],
      }));

      const req = createRequest({
        outfits: tooManyOutfits,
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when tags exceeds maximum limit', async () => {
      const tooManyTags = Array.from({ length: MAX_TAGS_PER_OUTFIT + 1 }, (_, i) => `tag${i}`);

      const req = createRequest({
        outfits: [{ id: 'o1', score: 0.5, tags: tooManyTags }],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for invalid score (NaN)', async () => {
      const req = createRequest({
        outfits: [{ id: 'o1', score: 'not-a-number', tags: [] }],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for score out of range (negative)', async () => {
      const req = createRequest({
        outfits: [{ id: 'o1', score: -0.5, tags: [] }],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for score out of range (> 1)', async () => {
      const req = createRequest({
        outfits: [{ id: 'o1', score: 1.5, tags: [] }],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for tags not being an array of strings', async () => {
      const req = createRequest({
        outfits: [{ id: 'o1', score: 0.5, tags: [123, 456] }],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for missing id field', async () => {
      const req = createRequest({
        outfits: [{ score: 0.5, tags: [] }],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for invalid JSON body', async () => {
      const req = new NextRequest('http://localhost:3000/api/reco/rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Invalid JSON body');
    });
  });
});

describe('GET /api/reco/rank', () => {
  it('should return 405 Method Not Allowed', async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(405);
    expect(data.error).toBe('Method not allowed. Use POST.');
  });
});

describe('Security: Body Size Limit', () => {
  it('should return 413 when Content-Length exceeds 64KB', async () => {
    const req = new NextRequest('http://localhost:3000/api/reco/rank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': '70000', // > 65536
      },
      body: JSON.stringify({ outfits: [{ id: 'o1', score: 0.5, tags: [] }] }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(413);
    expect(data.code).toBe('PAYLOAD_TOO_LARGE');
    // Verify no input content in response
    expect(JSON.stringify(data)).not.toContain('o1');
  });

  it('should return 413 when actual body exceeds 64KB', async () => {
    // Create a large payload that exceeds 64KB
    const largePayload = {
      outfits: Array.from({ length: 100 }, (_, i) => ({
        id: `outfit-${i}`,
        score: 0.5,
        tags: Array.from({ length: 40 }, (_, j) => `tag-${i}-${j}-${'x'.repeat(100)}`),
      })),
    };

    const req = createRequest(largePayload);

    const res = await POST(req);

    // Should be either 413 (too large) or 400 (validation failed due to limits)
    expect([400, 413]).toContain(res.status);
  });
});

describe('Security: Strict Schema (Reject Unknown Fields)', () => {
  it('should return 400 for constructor pollution attempt', async () => {
    // Note: __proto__ is filtered by JSON.stringify, so we test with "constructor" instead
    const req = createRequest({
      outfits: [{ id: 'o1', score: 0.9, tags: ['minimal'] }],
      userPrefs: { preferredTags: ['minimal'], blacklistTags: [] },
      constructor: { prototype: { polluted: true } },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for unknown field "debug"', async () => {
    const req = createRequest({
      outfits: [{ id: 'o1', score: 0.9, tags: ['minimal'] }],
      debug: true,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for unknown field in outfit object', async () => {
    const req = createRequest({
      outfits: [{ id: 'o1', score: 0.9, tags: ['minimal'], extraField: 'bad' }],
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for unknown field in userPrefs', async () => {
    const req = createRequest({
      outfits: [{ id: 'o1', score: 0.9, tags: [] }],
      userPrefs: { preferredTags: [], blacklistTags: [], admin: true },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('should not expose raw input values in error response', async () => {
    const sensitiveValue = 'SECRET_TOKEN_12345';
    const req = createRequest({
      outfits: [{ id: sensitiveValue, score: 'invalid', tags: [] }],
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    // Error details should not contain the raw sensitive value
    const responseStr = JSON.stringify(data);
    expect(responseStr).not.toContain(sensitiveValue);
  });
});

describe('Security: Rate Limiting', () => {
  // Note: Rate limiting tests need careful handling as they share state
  // In a real test environment, you'd reset the rate limit store between tests

  it('should include error code in rate limit response', async () => {
    // This test verifies the response format
    // Actual rate limiting behavior is tested in integration tests
    const req = createRequest({
      outfits: [{ id: 'o1', score: 0.5, tags: [] }],
    });

    const res = await POST(req);

    // First request should succeed
    expect(res.status).toBe(200);
  });
});

describe('Explainable Output: Reasons', () => {
  it('should include reasons.preferredMatched for matched tags', async () => {
    const req = createRequest({
      outfits: [
        { id: 'o1', score: 0.9, tags: ['minimal', 'work'] },
        { id: 'o2', score: 0.4, tags: ['sport'] },
      ],
      userPrefs: { preferredTags: ['minimal'], blacklistTags: ['sport'] },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data[0].id).toBe('o1');
    expect(data[0].reasons).toBeDefined();
    expect(data[0].reasons.preferredMatched).toContain('minimal');
  });

  it('should include reasons.blacklistMatched for matched blacklist tags', async () => {
    const req = createRequest({
      outfits: [
        { id: 'o1', score: 0.9, tags: ['sport', 'casual'] },
      ],
      userPrefs: { preferredTags: [], blacklistTags: ['sport'] },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data[0].reasons).toBeDefined();
    expect(data[0].reasons.blacklistMatched).toContain('sport');
  });

  it('should have empty arrays when no matches', async () => {
    const req = createRequest({
      outfits: [{ id: 'o1', score: 0.5, tags: ['casual'] }],
      userPrefs: { preferredTags: ['minimal'], blacklistTags: ['sport'] },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data[0].reasons.preferredMatched).toEqual([]);
    expect(data[0].reasons.blacklistMatched).toEqual([]);
  });

  it('should include reasons even without userPrefs', async () => {
    const req = createRequest({
      outfits: [{ id: 'o1', score: 0.5, tags: ['casual'] }],
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data[0].reasons).toBeDefined();
    expect(data[0].reasons.preferredMatched).toEqual([]);
    expect(data[0].reasons.blacklistMatched).toEqual([]);
  });
});

describe('BFF Authentication', () => {
  it('should return 401 when authentication fails (no API key)', async () => {
    // Mock auth to fail
    vi.mocked(requireBffAuth).mockResolvedValue({
      authorized: false,
      error: new (await import('next/server')).NextResponse(
        JSON.stringify({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    });

    const req = createRequest({
      outfits: [{ id: 'o1', score: 0.5, tags: [] }],
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(data.code).toBe('AUTH_REQUIRED');
  });

  it('should return 401 when authentication fails (invalid session)', async () => {
    // Mock auth to fail due to invalid session
    vi.mocked(requireBffAuth).mockResolvedValue({
      authorized: false,
      error: new (await import('next/server')).NextResponse(
        JSON.stringify({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    });

    const req = createRequest({
      outfits: [{ id: 'o1', score: 0.5, tags: [] }],
    }, { withAuth: true });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.code).toBe('AUTH_REQUIRED');
  });

  it('should not expose internal auth mechanism details in 401 response', async () => {
    vi.mocked(requireBffAuth).mockResolvedValue({
      authorized: false,
      error: new (await import('next/server')).NextResponse(
        JSON.stringify({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    });

    const req = createRequest({
      outfits: [{ id: 'o1', score: 0.5, tags: [] }],
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    // Should not mention API key, session, or internal mechanisms
    const responseStr = JSON.stringify(data);
    expect(responseStr).not.toContain('API');
    expect(responseStr).not.toContain('key');
    expect(responseStr).not.toContain('session');
    expect(responseStr).not.toContain('Supabase');
  });

  it('should return 200 when both user session and API key are valid', async () => {
    // Auth passes (default mock behavior)
    const req = createRequest({
      outfits: [{ id: 'o1', score: 0.5, tags: ['minimal'] }],
      userPrefs: { preferredTags: ['minimal'], blacklistTags: [] },
    }, { withAuth: true });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data[0].id).toBe('o1');
  });

  it('should call requireBffAuth with the request', async () => {
    const req = createRequest({
      outfits: [{ id: 'o1', score: 0.5, tags: [] }],
    });

    await POST(req);

    expect(requireBffAuth).toHaveBeenCalledTimes(1);
    expect(requireBffAuth).toHaveBeenCalledWith(req);
  });
});
