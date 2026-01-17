// apps/web/lib/security/rate-limit.ts
// Rate limit utility with Redis backend (fail-open in development)

import { createClient } from 'redis';

// Configuration
const RATE_LIMIT_WINDOW = 600; // 10 minutes in seconds
const RATE_LIMIT_MAX_REQUESTS = 10; // Max requests per window
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Get or initialize Redis client
 * Fail-open strategy: if Redis is unavailable in development, allow requests
 * Fail-closed strategy: if Redis is unavailable in production, deny requests
 */
async function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = createClient({ url: REDIS_URL });
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('[RateLimit] Redis connection failed:', error);
    return null;
  }
}

/**
 * Check if request should be rate limited
 * @param key - Identifier (user ID or IP address)
 * @param maxRequests - Maximum requests allowed in window
 * @param windowSeconds - Time window in seconds
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS,
  windowSeconds: number = RATE_LIMIT_WINDOW,
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  const redisClient = await getRedisClient();

  if (!redisClient) {
    // Redis unavailable
    const failOpen = process.env.NODE_ENV !== 'production';
    console.warn(`[RateLimit] Redis unavailable, fail-${failOpen ? 'open' : 'closed'}`);
    return {
      allowed: failOpen,
      remaining: maxRequests,
      resetAt: Date.now() + windowSeconds * 1000,
    };
  }

  try {
    const rateLimitKey = `ratelimit:${key}`;
    const current = await redisClient.incr(rateLimitKey);

    // Set expiration on first request
    if (current === 1) {
      await redisClient.expire(rateLimitKey, windowSeconds);
    }

    const ttl = await redisClient.ttl(rateLimitKey);
    const resetAt = Date.now() + (ttl > 0 ? ttl : windowSeconds) * 1000;

    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetAt,
    };
  } catch (error) {
    console.error('[RateLimit] Check failed:', error);
    // Fail-open/closed based on environment
    return {
      allowed: process.env.NODE_ENV !== 'production',
      remaining: maxRequests,
      resetAt: Date.now() + windowSeconds * 1000,
    };
  }
}

/**
 * Extract client IP from request headers
 * Handles X-Forwarded-For header from reverse proxies
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    // X-Forwarded-For format: client, proxy1, proxy2
    return forwarded.split(',')[0].trim();
  }

  return headers.get('x-real-ip') || 'unknown';
}

/**
 * Configuration constants for rate limiting upload endpoint
 */
export const UPLOAD_RATE_LIMIT = {
  maxRequests: 10,
  windowSeconds: 600, // 10 minutes
};
