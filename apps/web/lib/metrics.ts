// apps/web/lib/metrics.ts

/**
 * Sanitizes User-Agent string for logging
 * - Replaces \r \n with spaces
 * - Trims whitespace
 * - Truncates to 256 characters max
 */
export function sanitizeUserAgent(ua?: string): string {
  if (!ua) return '';

  // Replace \r and \n with spaces, compress whitespace, then trim
  const sanitized = ua.replace(/[\r\n]/g, ' ').replace(/\s+/g, ' ').trim();

  // Truncate to 256 characters
  return sanitized.substring(0, 256);
}

/**
 * Logs deprecation metrics for legacy outfits endpoints
 * Outputs structured JSON only - no sensitive data logging
 *
 * @param endpoint - API endpoint name (e.g., 'POST /api/outfits')
 * @param format - Request format (e.g., 'legacy' or 'modern')
 * @param itemCount - Number of items in the outfit
 * @param userAgent - Sanitized User-Agent string
 */
export function logDeprecationMetric(params: {
  endpoint: string;
  format: string;
  itemCount: number;
  userAgent: string;
}): void {
  const metric = {
    timestamp: new Date().toISOString(),
    type: 'deprecation_metric',
    endpoint: params.endpoint,
    format: params.format,
    itemCount: params.itemCount,
    userAgent: params.userAgent,
  };

  // Output as structured JSON
  console.log(JSON.stringify(metric));
}

type SecurityReason = 'auth_required' | 'forbidden' | 'invalid_payload';

/**
 * Logs security events (401, 403, suspicious activity, etc.)
 * Outputs structured JSON only - no sensitive data logging (tokens, cookies, email, etc.)
 *
 * @param endpoint - API endpoint name (e.g., '/api/wardrobe/items')
 * @param statusCode - HTTP status code (401, 403, etc.)
 * @param reason - Brief reason for security event (must be from allowlist)
 * @param userAgent - Raw User-Agent string (sanitized internally)
 *
 * NOTE: userAgent is automatically sanitized inside this function.
 * Do NOT pass raw request headers (Authorization, Cookie, etc.)
 */
export function logSecurityEvent(params: {
  endpoint: string;
  statusCode: number;
  reason: SecurityReason;
  userAgent: string;
}): void {
  // 內部強制清洗 userAgent
  const sanitizedUA = sanitizeUserAgent(params.userAgent);

  const event = {
    timestamp: new Date().toISOString(),
    type: 'security_event',
    endpoint: params.endpoint,
    statusCode: params.statusCode,
    reason: params.reason,
    userAgent: sanitizedUA,
  };

  // Output as structured JSON
  console.warn(JSON.stringify(event));
}
