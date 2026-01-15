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
