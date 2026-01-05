/**
 * Redis-based rate limiter for authentication endpoints
 * Supports horizontal scaling across multiple instances
 */

import { createClient } from 'redis';
import { createHash, createHmac } from 'crypto';

// Rate limit configuration
const WINDOW_SEC = 900; // 15 minutes
const EMAIL_LIMIT = 5;
const IP_LIMIT = 20;

/**
 * Get RATE_LIMIT_SECRET with production safety check
 * Production MUST have explicit RATE_LIMIT_SECRET set
 */
function getRateLimitSecret(): string {
  const secret = process.env.RATE_LIMIT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && !secret) {
    const errorMsg =
      'RATE_LIMIT_SECRET must be set in production environment';
    console.error(`[RateLimit] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Development: use default secret if not provided
  return secret || 'vesti-ratelimit-secret-dev-only';
}

let RATE_LIMIT_SECRET: string;
try {
  RATE_LIMIT_SECRET = getRateLimitSecret();
} catch (error) {
  // Initialize with error marker for production
  RATE_LIMIT_SECRET = '';
}

// Redis key prefix (environment isolation)
// Priority: RATELIMIT_PREFIX > NODE_ENV > 'dev'
function getRedisKeyPrefix(): string {
  const customPrefix = process.env.RATELIMIT_PREFIX;
  if (customPrefix) {
    return customPrefix;
  }

  const env = process.env.NODE_ENV || 'dev';
  return env;
}

/**
 * Hash email to avoid storing PII in Redis keys
 * Uses HMAC-SHA256 for consistency and security
 * @param normalizedEmail - Email already normalized (trim + lowercase)
 * @returns Full 32 hex chars of HMAC-SHA256 hash (no collision risk)
 */
function hashEmail(normalizedEmail: string): string {
  if (!RATE_LIMIT_SECRET) {
    throw new Error('[RateLimit] RATE_LIMIT_SECRET not initialized');
  }

  return createHmac('sha256', RATE_LIMIT_SECRET)
    .update(normalizedEmail)
    .digest('hex'); // ✅ Full 32 hex chars (SHA256 = 256 bits = 64 hex, but HMAC-SHA256 = 256 bits = 64 hex)
}

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;
let redisConnected = false;

/**
 * Get or create Redis client
 */
function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('[RateLimit] REDIS_URL not configured, rate limiting disabled');
    return null;
  }

  try {
    redisClient = createClient({ url: redisUrl });

    redisClient.on('error', (err) => {
      console.error('[RateLimit] Redis error:', err.message);
      redisConnected = false;
    });

    redisClient.on('connect', () => {
      redisConnected = true;
      console.log('[RateLimit] Redis connected');
    });

    // Non-blocking connection
    redisClient.connect().catch(() => {
      console.warn('[RateLimit] Failed to connect to Redis');
    });

    return redisClient;
  } catch (error) {
    console.warn('[RateLimit] Redis initialization failed:', error);
    return null;
  }
}

/**
 * Check rate limit using Redis INCR and EXPIRE
 * @param scope - Scope prefix (e.g., "email", "ip")
 * @param key - Unique identifier (normalized)
 * @param limit - Maximum allowed requests
 * @returns { allowed: boolean, retryAfter?: number } retryAfter in seconds
 */
async function checkRateLimit(
  scope: string,
  key: string,
  limit: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const client = getRedisClient();
  const isProduction = process.env.NODE_ENV === 'production';

  // Production: Fail-closed (deny) if Redis unavailable
  // Development: Fail-open (allow) if Redis unavailable
  if (!client || !redisConnected) {
    if (isProduction) {
      console.warn('[RateLimit] Redis unavailable in production, denying request');
      return { allowed: false, retryAfter: 60 };
    }
    return { allowed: true };
  }

  try {
    // Redis key with environment + app + scope: dev:vesti:signin:email:user@example.com
    const prefix = getRedisKeyPrefix();
    const redisKey = `${prefix}:vesti:signin:${scope}:${key}`;

    // Increment counter (atomic operation)
    const count = await client.incr(redisKey);

    // Set expiration on first increment
    if (count === 1) {
      await client.expire(redisKey, WINDOW_SEC);
    }

    // Check if limit exceeded
    if (count > limit) {
      // Get remaining time (TTL in seconds)
      const ttl = await client.ttl(redisKey);
      const retryAfter = ttl > 0 ? ttl : WINDOW_SEC;
      return { allowed: false, retryAfter };
    }

    return { allowed: true };
  } catch (error) {
    console.error('[RateLimit] Check error:', String(error));
    // Production: Fail-closed on error
    if (isProduction) {
      return { allowed: false, retryAfter: 60 };
    }
    // Development: Fail-open on error
    return { allowed: true };
  }
}

/**
 * Reset rate limit for a key
 */
async function resetLimit(scope: string, key: string): Promise<void> {
  const client = getRedisClient();

  if (!client || !redisConnected) {
    return;
  }

  try {
    const prefix = getRedisKeyPrefix();
    const redisKey = `${prefix}:vesti:signin:${scope}:${key}`;
    await client.del(redisKey);
  } catch (error) {
    console.error('[RateLimit] Reset error:', String(error));
    // Silently fail on reset
  }
}

/**
 * Normalize email for rate limiting (trim + lowercase)
 * Prevents bypassing limits with case variations or whitespace
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Check rate limit for email
 */
export async function checkEmailRateLimit(email: string) {
  try {
    const normalizedEmail = normalizeEmail(email);
    const emailHash = hashEmail(normalizedEmail);
    return checkRateLimit('email', emailHash, EMAIL_LIMIT);
  } catch (error) {
    console.error('[RateLimit] Email hash error:', String(error));
    // Production: Fail-closed on hash error
    if (process.env.NODE_ENV === 'production') {
      return { allowed: false, retryAfter: 60 };
    }
    // Development: Fail-open on hash error
    return { allowed: true };
  }
}

/**
 * Check rate limit for IP
 */
export async function checkIPRateLimit(ip: string) {
  return checkRateLimit('ip', ip, IP_LIMIT);
}

/**
 * Reset rate limit for email (used on successful login)
 */
export async function resetEmailRateLimit(email: string) {
  try {
    const normalizedEmail = normalizeEmail(email);
    const emailHash = hashEmail(normalizedEmail);
    return resetLimit('email', emailHash);
  } catch (error) {
    console.error('[RateLimit] Email hash error during reset:', String(error));
    // Silently fail on reset (non-blocking operation)
  }
}

/**
 * Reset rate limit for IP (used on successful login)
 */
export async function resetIPRateLimit(ip: string) {
  return resetLimit('ip', ip);
}

/**
 * Helper to scan and delete keys in batches
 * Uses SCAN to avoid blocking Redis
 * @param pattern - Key pattern to match
 * @param batchSize - Max keys per SCAN call
 */
async function scanAndDeleteKeys(
  pattern: string,
  batchSize: number = 1000
): Promise<void> {
  const client = getRedisClient();

  if (!client || !redisConnected) {
    return;
  }

  let cursor = '0';

  do {
    // Scan keys matching pattern (returns [nextCursor, keys])
    // Note: Keep cursor as string throughout to avoid client compatibility issues
    const result = await (client.scan as any)(cursor, {
      MATCH: pattern,
      COUNT: batchSize,
    });

    const nextCursor = String(result[0] ?? '0');
    const keys: string[] = result[1] ?? [];

    // Delete batch of keys
    if (keys.length > 0) {
      await client.del(keys);
    }

    cursor = nextCursor;
  } while (cursor !== '0');
}

/**
 * Clear all rate limits (for testing)
 * Uses SCAN to avoid blocking Redis
 */
export async function clearAllRateLimits() {
  try {
    const prefix = getRedisKeyPrefix();
    const pattern = `${prefix}:vesti:signin:*`;
    await scanAndDeleteKeys(pattern, 1000);
  } catch (error) {
    console.error('[RateLimit] Clear error:', String(error));
  }
}
