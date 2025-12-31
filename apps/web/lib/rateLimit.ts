/**
 * Rate Limiting with Redis/Upstash
 * Supports horizontal scaling with atomic operations.
 * Falls back to in-memory store for local development.
 */

import { Redis } from '@upstash/redis';

// In-memory fallback for local development
const memoryStore = new Map<string, { count: number; resetTime: number }>();

// Lazy-initialize Redis client (only when env vars are set)
let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    redisClient = new Redis({ url, token });
    return redisClient;
  }

  return null;
}

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix: string;     // Key prefix for namespacing
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;         // Max requests per window
  resetAfter: number;    // Seconds until quota resets (IETF draft semantics)
  resetAt: number;       // Unix epoch seconds (for debug/logging)
  retryAfter?: number;   // Seconds until reset (only when blocked, same as resetAfter)
}

/**
 * Check rate limit using Redis atomic INCR + EXPIRE.
 * Falls back to in-memory store if Redis is not configured.
 *
 * Key format: {prefix}:{identifier}
 * Example: tags:user123:203.0.113.10
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `${config.keyPrefix}:${identifier}`;
  const redis = getRedisClient();

  if (redis) {
    return checkRateLimitRedis(redis, key, config);
  }

  return checkRateLimitMemory(key, config);
}

/**
 * Lua script for atomic rate limiting.
 * Uses standard KEYS[1]/ARGV[1] syntax for Redis/Upstash SDK compatibility.
 * Returns [count, ttl] to avoid race conditions.
 */
const RATE_LIMIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('TTL', KEYS[1])
if ttl == -1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}
`;

/**
 * Redis-based rate limit (production).
 * Uses Lua script for true atomic INCR + EXPIRE.
 * Prevents race conditions that could create keys without TTL.
 */
async function checkRateLimitRedis(
  redis: Redis,
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const windowSec = Math.ceil(config.windowMs / 1000);

  // Execute Lua script atomically (only pass windowSec, maxRequests checked in JS)
  const result = await redis.eval(
    RATE_LIMIT_SCRIPT,
    [key],
    [windowSec]
  ) as [number, number];

  const [count, ttl] = result;

  // Clamp TTL to valid range: must be positive and <= windowSec
  // Handles edge cases: ttl=-1 (no expiry), ttl=0, or ttl > windowSec (clock skew)
  const safeTtl = (ttl > 0 && ttl <= windowSec) ? ttl : windowSec;
  const nowEpochSec = Math.floor(Date.now() / 1000);
  const resetAtEpoch = nowEpochSec + safeTtl;

  if (count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      limit: config.maxRequests,
      resetAfter: safeTtl,
      resetAt: resetAtEpoch,
      retryAfter: safeTtl,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - count,
    limit: config.maxRequests,
    resetAfter: safeTtl,
    resetAt: resetAtEpoch,
  };
}

/**
 * In-memory rate limit (development fallback).
 * WARNING: Does not work across multiple instances.
 */
function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowSec = Math.ceil(config.windowMs / 1000);
  const record = memoryStore.get(key);

  if (!record || now >= record.resetTime) {
    const newResetTime = now + config.windowMs;
    memoryStore.set(key, { count: 1, resetTime: newResetTime });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      limit: config.maxRequests,
      resetAfter: windowSec,
      resetAt: Math.floor(newResetTime / 1000),
    };
  }

  const resetAfterMs = record.resetTime - now;
  const resetAfterSec = Math.ceil(resetAfterMs / 1000);
  const resetAtEpoch = Math.floor(record.resetTime / 1000);

  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      limit: config.maxRequests,
      resetAfter: resetAfterSec,
      resetAt: resetAtEpoch,
      retryAfter: resetAfterSec,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    limit: config.maxRequests,
    resetAfter: resetAfterSec,
    resetAt: resetAtEpoch,
  };
}

/**
 * Platform-specific trusted IP header mapping.
 * Only trust headers when running on the corresponding platform.
 *
 * SECURITY: Each header is ONLY trusted when DEPLOY_PLATFORM matches.
 * This prevents attackers from spoofing headers on non-matching platforms.
 *
 * Supported DEPLOY_PLATFORM values:
 * - 'vercel': trusts x-vercel-forwarded-for
 * - 'cloudflare': trusts cf-connecting-ip
 * - 'nginx': trusts x-real-ip (for self-hosted behind nginx)
 */
const PLATFORM_HEADER_MAP: Record<string, string> = {
  vercel: 'x-vercel-forwarded-for',
  cloudflare: 'cf-connecting-ip',
  nginx: 'x-real-ip',
};

/**
 * Extract client IP based on DEPLOY_PLATFORM environment variable.
 * Only trusts the header corresponding to the configured platform.
 *
 * @param headers - Request headers
 * @returns Client IP or 'unknown' if not determinable
 */
export function getClientIP(headers: Headers): string {
  const platform = process.env.DEPLOY_PLATFORM?.toLowerCase();

  // Only trust the header specific to our deployment platform
  if (platform && PLATFORM_HEADER_MAP[platform]) {
    const trustedHeader = PLATFORM_HEADER_MAP[platform];
    const value = headers.get(trustedHeader);
    if (value) {
      return value.split(',')[0].trim();
    }
  }

  // Fallback: trust x-forwarded-for only if explicitly enabled
  // (useful for local dev behind proxy or custom setups)
  if (process.env.TRUST_X_FORWARDED_FOR === 'true') {
    const xff = headers.get('x-forwarded-for');
    if (xff) {
      return xff.split(',')[0].trim();
    }
  }

  // No trusted source available - use 'unknown' as identifier
  // Rate limit will still work but shared across all unknown IPs
  return 'unknown';
}
