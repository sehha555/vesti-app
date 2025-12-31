// apps/web/app/api/reco/rank/route.ts
// POST /api/reco/rank - Rank outfits based on scores and user preferences
// Security: BFF dual auth, body size limit, strict schema, rate limiting, sanitized errors

import { NextRequest, NextResponse } from 'next/server';
import { RankRequestSchema, MAX_BODY_SIZE } from '../../../../lib/validation/recoRank';
import { rankOutfits, RankableOutfit, UserPreferences } from '@/services/reco/modules/ranking/rankOutfits';
import { requireBffAuth } from '../../_middleware/auth';

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 60 seconds
const RATE_LIMIT_MAX_REQUESTS = 120; // max requests per window per IP

// In-memory rate limit store (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface ErrorResponse {
  error: string;
  code?: string;
  details?: string[];
}

/**
 * Extracts client IP from request headers (handles proxies)
 */
function getClientIP(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

/**
 * Checks rate limit for a given IP
 * Returns { allowed: boolean, retryAfter?: number }
 */
function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now >= record.resetTime) {
    // First request or window expired
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

/**
 * POST /api/reco/rank
 * Ranks outfits based on base scores and user preferences.
 *
 * Security features:
 * - BFF dual authentication (user session + internal API key) - returns 401 if failed
 * - Body size limit (64KB) - returns 413 if exceeded
 * - Strict schema validation - rejects unknown fields
 * - Rate limiting (120 req/60s per IP) - returns 429 if exceeded
 * - Sanitized error responses - no sensitive data exposed
 *
 * Response: Array of ranked outfits with finalScore and explainable reasons
 */
export async function POST(req: NextRequest) {
  try {
    // 0. BFF dual-layer authentication (user session + internal API key)
    const authResult = await requireBffAuth(req);
    if (!authResult.authorized) {
      return authResult.error!;
    }

    // 1. Check rate limit
    const clientIP = getClientIP(req);
    const rateCheck = checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.retryAfter) },
        }
      );
    }

    // 2. Check Content-Length before parsing
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Request body too large', code: 'PAYLOAD_TOO_LARGE' },
        { status: 413 }
      );
    }

    // 3. Parse request body with size check
    let body: unknown;
    try {
      const text = await req.text();
      if (text.length > MAX_BODY_SIZE) {
        return NextResponse.json<ErrorResponse>(
          { error: 'Request body too large', code: 'PAYLOAD_TOO_LARGE' },
          { status: 413 }
        );
      }
      body = JSON.parse(text);
    } catch {
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid JSON body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    // 4. Validate with strict Zod schema (rejects unknown fields)
    const parseResult = RankRequestSchema.safeParse(body);

    if (!parseResult.success) {
      // Zod uses 'issues'
      const issues = parseResult.error.issues || [];
      // Only expose field path and error code, never the raw value
      const errorMessages = issues.map(
        (e: { path: (string | number | symbol)[]; message: string; code?: string }) =>
          `${e.path.map(String).join('.')}: ${e.code || 'invalid'}`
      );
      return NextResponse.json<ErrorResponse>(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: errorMessages },
        { status: 400 }
      );
    }

    const { outfits, userPrefs } = parseResult.data;

    // 5. Convert to ranking module types
    const rankableOutfits: RankableOutfit[] = outfits.map((o) => ({
      id: o.id,
      score: o.score,
      tags: o.tags,
    }));

    const preferences: UserPreferences | undefined = userPrefs
      ? {
          preferredTags: userPrefs.preferredTags,
          blacklistTags: userPrefs.blacklistTags,
        }
      : undefined;

    // 6. Perform ranking with explainable output
    const rankedOutfits = rankOutfits(rankableOutfits, preferences);

    return NextResponse.json(rankedOutfits, { status: 200 });
  } catch (error) {
    // Log error without exposing sensitive information (no stack, no env vars)
    console.error('[API] POST /api/reco/rank error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// GET method not allowed
export async function GET() {
  return NextResponse.json<ErrorResponse>(
    { error: 'Method not allowed. Use POST.', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}
