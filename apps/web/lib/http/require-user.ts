import type { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { getSupabaseAndUser } from '../supabase/server';
import { checkRateLimit, type RateLimitConfig } from '../rateLimit';
import { logSecurityEvent } from '../metrics';
import { jsonNoStore } from './no-store';

// apps/web 沒開 strictNullChecks，union 靠 truthiness 收窄不了；失敗時 supabase / user 為 null
type RequireUserResult =
  | { supabase: SupabaseClient; user: User; response: null }
  | { supabase: null; user: null; response: NextResponse };

/**
 * API route 共用的開頭：驗證登入（session），有給 limit 就依使用者限流。
 * 失敗時回傳已組好的 401 / 429（no-store，429 帶 Retry-After 與 RateLimit-*），並記 security log。
 *
 * @example
 * const auth = await requireUser(req, { keyPrefix: 'x', maxRequests: 10, windowMs: 60_000 });
 * if (auth.response) return auth.response;
 * const { supabase, user } = auth;
 */
export async function requireUser(req: NextRequest, limit?: RateLimitConfig): Promise<RequireUserResult> {
  const endpoint = req.nextUrl.pathname;
  const userAgent = req.headers.get('user-agent') || '';
  const { supabase, user } = await getSupabaseAndUser();

  if (!user) {
    logSecurityEvent({ endpoint, statusCode: 401, reason: 'auth_required', userAgent });
    return { supabase: null, user: null, response: jsonNoStore({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (limit) {
    const rl = await checkRateLimit(user.id, limit);
    if (!rl.allowed) {
      logSecurityEvent({ endpoint, statusCode: 429, reason: 'forbidden', userAgent });
      return {
        supabase: null,
        user: null,
        response: jsonNoStore(
          { error: '操作太頻繁，請稍後再試' },
          {
            status: 429,
            headers: {
              'Retry-After': String(rl.retryAfter ?? rl.resetAfter),
              'RateLimit-Limit': String(rl.limit),
              'RateLimit-Remaining': String(rl.remaining),
              'RateLimit-Reset': String(rl.resetAfter),
            },
          }
        ),
      };
    }
  }

  return { supabase, user, response: null };
}
