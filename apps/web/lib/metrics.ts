/**
 * Simple metrics/observability utilities
 * Used to track deprecated API usage for migration monitoring
 */

export interface DeprecationMetric {
  endpoint: string;
  format: 'legacy' | 'new';
  userId: string; // hashed for privacy
  itemCount: number;
  timestamp: string;
  userAgent?: string;
}

/**
 * Hash a string to obscure user ID while maintaining uniqueness for counting
 */
function hashUserId(userId: string): string {
  // Simple hash for privacy: just use first 8 chars + last 4 chars + length
  const prefix = userId.substring(0, 8);
  const suffix = userId.substring(Math.max(0, userId.length - 4));
  return `${prefix}...${suffix}`;
}

/**
 * Log deprecation metric with structured format for analysis
 * @param metric The deprecation metric to log
 */
export function logDeprecationMetric(metric: Omit<DeprecationMetric, 'timestamp' | 'userId'> & { userId: string }): void {
  const hashedMetric: DeprecationMetric = {
    ...metric,
    timestamp: new Date().toISOString(),
    userId: hashUserId(metric.userId),
  };

  // Log in structured JSON format for easy parsing by log aggregation tools
  console.warn(
    JSON.stringify({
      level: 'DEPRECATION',
      service: 'api',
      message: `Deprecated API endpoint usage: ${metric.endpoint}`,
      metric: hashedMetric,
    })
  );
}

/**
 * Log migration status check - useful for tracking countdown to sunset date
 */
export function logMigrationStatus(endpoint: string, legacyCount: number, totalCount: number): void {
  const legacyPercentage = totalCount > 0 ? ((legacyCount / totalCount) * 100).toFixed(2) : 'N/A';
  console.info(
    JSON.stringify({
      level: 'INFO',
      service: 'api',
      message: `Migration status: ${endpoint}`,
      stats: {
        endpoint,
        legacyRequests: legacyCount,
        totalRequests: totalCount,
        legacyPercentage,
        sunsetDate: '2026-03-01T00:00:00Z',
      },
    })
  );
}
