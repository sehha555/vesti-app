// apps/web/app/api/wardrobe/items/[id]/tags/route.ts
// PATCH /api/wardrobe/items/{id}/tags - Update wardrobe item tags (AI-generated)
// Security: User session auth, object-level authorization, Redis rate limiting, strict schema

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireUserAuth } from '../../../../_middleware/auth';
import { checkRateLimit, getClientIP } from '../../../../../../lib/rateLimit';

// Force Node.js runtime
export const runtime = 'nodejs';

// Rate limit config: 30 requests per 60 seconds per user+IP
const RATE_LIMIT_CONFIG = {
  windowMs: 60000,
  maxRequests: 30,
  keyPrefix: 'tags',
};

// Valid enum values
const VALID_SEASONS = ['spring', 'summer', 'autumn', 'winter', 'all_seasons'] as const;
const VALID_OCCASIONS = ['casual', 'work', 'formal', 'sport', 'outdoor', 'date', 'home'] as const;

// Strict Zod schema for tags (rejects unknown fields)
const TagsSchema = z.object({
  category: z.string().min(1).max(100),
  color: z.string().min(1).max(100),
  pattern: z.string().min(1).max(100),
  material: z.string().min(1).max(100),
  style: z.string().min(1).max(100),
  season: z.enum(VALID_SEASONS),
  occasion: z.enum(VALID_OCCASIONS),
}).strict();

type TagsInput = z.infer<typeof TagsSchema>;

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ErrorResponse {
  error: string;
  code?: string;
  details?: string[];
}

// Initialize Supabase admin client with service role key (server-side only)
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Database configuration incomplete');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * PATCH /api/wardrobe/items/{id}/tags
 * Updates AI-generated tags for a wardrobe item.
 *
 * Security features:
 * - User session authentication (Supabase auth) - returns 401 if failed
 * - Object-level authorization (item must belong to user) - returns 404 to avoid existence leak
 * - Redis rate limiting (30 req/60s per user+IP, atomic INCR) - returns 429 if exceeded
 * - Strict schema validation with enums - returns 422 if invalid
 * - Sanitized error responses - no sensitive data exposed
 *
 * Request body:
 * {
 *   "category": "string",
 *   "color": "string",
 *   "pattern": "string",
 *   "material": "string",
 *   "style": "string",
 *   "season": "spring|summer|autumn|winter|all_seasons",
 *   "occasion": "casual|work|formal|sport|outdoor|date|home"
 * }
 */
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id: itemId } = await params;

  try {
    // 1. User authentication (session-based, NO internal API key)
    const authResult = await requireUserAuth(req);
    if (!authResult.authorized) {
      return authResult.error!;
    }

    const userId = authResult.userId!;

    // 2. Rate limit check (Redis atomic INCR, supports horizontal scaling)
    const clientIP = getClientIP(req.headers);
    // When clientIP is unknown, use user-only key to avoid cross-user collision
    const rateKeyId = clientIP === 'unknown' ? userId : `${userId}:${clientIP}`;
    const rateCheck = await checkRateLimit(rateKeyId, RATE_LIMIT_CONFIG);

    // Standard RateLimit headers (IETF draft: reset is delay-seconds)
    const rateLimitHeaders = {
      // RFC draft standard (reset = seconds until quota resets)
      'RateLimit-Limit': String(rateCheck.limit),
      'RateLimit-Remaining': String(rateCheck.remaining),
      'RateLimit-Reset': String(rateCheck.resetAfter),
      // X- prefix (legacy clients, also using seconds for consistency)
      'X-RateLimit-Limit': String(rateCheck.limit),
      'X-RateLimit-Remaining': String(rateCheck.remaining),
      'X-RateLimit-Reset': String(rateCheck.resetAfter),
      // Epoch timestamp for debug/logging
      'X-RateLimit-Reset-At': String(rateCheck.resetAt),
    };

    if (!rateCheck.allowed) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
        {
          status: 429,
          headers: {
            ...rateLimitHeaders,
            'Retry-After': String(rateCheck.retryAfter),
          },
        }
      );
    }

    // 3. Validate item ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(itemId)) {
      // Return 404 to avoid leaking valid ID format information
      return NextResponse.json<ErrorResponse>(
        { error: 'Item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 4. Parse request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid JSON body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    // 5. Validate with strict Zod schema
    const parseResult = TagsSchema.safeParse(body);

    if (!parseResult.success) {
      const issues = parseResult.error.issues || [];
      const errorMessages = issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`
      );
      return NextResponse.json<ErrorResponse>(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: errorMessages },
        { status: 422 }
      );
    }

    const tags: TagsInput = parseResult.data;

    // 6. Object-level authorization: verify item belongs to user
    const supabaseAdmin = getSupabaseAdmin();

    const { data: existingItem, error: fetchError } = await supabaseAdmin
      .from('clothing_items')
      .select('id, user_id')
      .eq('id', itemId)
      .single();

    // SECURITY: Return 404 for both "not found" AND "not owned" to prevent existence leak
    if (fetchError || !existingItem || existingItem.user_id !== userId) {
      if (existingItem && existingItem.user_id !== userId) {
        // Structured audit log for unauthorized access (no token/secrets)
        console.warn(JSON.stringify({
          event: 'wardrobe.tags.update_denied',
          userId,
          itemId,
          reason: 'not_owner',
          platform: process.env.DEPLOY_PLATFORM ?? 'unknown',
          clientIP: clientIP === 'unknown' ? null : clientIP,
          timestamp: new Date().toISOString(),
        }));
      }
      return NextResponse.json<ErrorResponse>(
        { error: 'Item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 7. Map tags to database columns
    const updateData = {
      type: tags.category.toLowerCase(),
      colors: [tags.color],
      pattern: tags.pattern.toLowerCase(),
      material: tags.material.toLowerCase(),
      style: tags.style.toLowerCase(),
      season: tags.season.replace('_', '-'), // all_seasons -> all-season
      occasion: [tags.occasion],
      updated_at: new Date().toISOString(),
    };

    // 8. Update item in database
    const { data: updatedItem, error: updateError } = await supabaseAdmin
      .from('clothing_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) {
      console.error('[Tags] Database update failed');
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to update tags', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    // 9. Return updated tags with rate limit info
    return NextResponse.json({
      id: updatedItem.id,
      category: tags.category,
      color: tags.color,
      pattern: tags.pattern,
      material: tags.material,
      style: tags.style,
      season: tags.season,
      occasion: tags.occasion,
    }, {
      status: 200,
      headers: rateLimitHeaders,
    });

  } catch (error) {
    console.error('[Tags] Unexpected error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Other methods not allowed
export async function GET(): Promise<NextResponse<ErrorResponse>> {
  return NextResponse.json<ErrorResponse>(
    { error: 'Method not allowed. Use PATCH.', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}

export async function POST(): Promise<NextResponse<ErrorResponse>> {
  return NextResponse.json<ErrorResponse>(
    { error: 'Method not allowed. Use PATCH.', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}

export async function PUT(): Promise<NextResponse<ErrorResponse>> {
  return NextResponse.json<ErrorResponse>(
    { error: 'Method not allowed. Use PATCH.', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}

export async function DELETE(): Promise<NextResponse<ErrorResponse>> {
  return NextResponse.json<ErrorResponse>(
    { error: 'Method not allowed. Use PATCH.', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}
