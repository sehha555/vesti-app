import { describe, it, expect } from 'vitest';
import { currentPeriodStart } from './recommendation-period';

describe('currentPeriodStart', () => {
  it('每天一次：台灣凌晨 2 點仍算當天（不是 UTC 的前一天）', () => {
    // 台灣 2026-09-30 02:00 = UTC 09-29 18:00
    const start = currentPeriodStart(new Date('2026-09-29T18:00:00Z'), 24);
    expect(start.toISOString()).toBe('2026-09-29T16:00:00.000Z'); // 台灣 09-30 00:00
  });

  it('每天一次：台灣晚上 23:59 還是同一天', () => {
    const start = currentPeriodStart(new Date('2026-09-30T15:59:00Z'), 24);
    expect(start.toISOString()).toBe('2026-09-29T16:00:00.000Z');
  });

  it('每 6 小時：台灣 13:30 落在 12:00 開始的時段', () => {
    const start = currentPeriodStart(new Date('2026-09-30T05:30:00Z'), 6);
    expect(start.toISOString()).toBe('2026-09-30T04:00:00.000Z'); // 台灣 12:00
  });
});
