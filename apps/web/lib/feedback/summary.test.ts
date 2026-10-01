import { describe, it, expect } from 'vitest';
import { summarizeFeedback, type FeedbackRow } from './summary';

const names = new Map([
  ['t1', '白T'],
  ['b1', '牛仔褲'],
  ['t2', '黑色襯衫'],
  ['b2', '西裝褲'],
  ['t3', '紅色毛衣'],
]);
const NOW = new Date('2026-09-25T08:00:00Z');

const row = (action: FeedbackRow['action'], ids: string[], daysAgo = 0, reasons: string[] = []): FeedbackRow => ({
  action,
  outfit_key: [...ids].sort().join('|'),
  item_ids: ids,
  reasons,
  created_at: new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString(),
});

describe('summarizeFeedback', () => {
  it('沒有回饋回 null', () => {
    expect(summarizeFeedback([], names, NOW)).toBeNull();
  });

  it('分成喜歡、不喜歡（附原因）', () => {
    const text = summarizeFeedback(
      [row('choose', ['t1', 'b1'], 1), row('dislike', ['t2', 'b2'], 2, ['too_formal', 'color'])],
      names,
      NOW
    )!;
    expect(text).toContain('喜歡過的組合');
    expect(text).toContain('白T + 牛仔褲');
    expect(text).toContain('不喜歡的組合');
    expect(text).toContain('黑色襯衫 + 西裝褲（太正式、配色不喜歡）');
  });

  it('同一套以最新的表態為準', () => {
    // 由新到舊：先前按了要這套，後來改按不要
    const text = summarizeFeedback([row('dislike', ['t1', 'b1'], 0, ['style']), row('choose', ['t1', 'b1'], 3)], names, NOW)!;
    expect(text).not.toContain('喜歡過的組合');
    expect(text).toContain('白T + 牛仔褲（風格不合）');
  });

  it('滑過一次不算，滑過兩次以上才算不太喜歡', () => {
    expect(summarizeFeedback([row('skip', ['t3', 'b1'])], names, NOW)).toBeNull();
    const text = summarizeFeedback([row('skip', ['t3', 'b1']), row('skip', ['t3', 'b1'], 1)], names, NOW)!;
    expect(text).toContain('紅色毛衣 + 牛仔褲（推薦過 2 次都直接滑過）');
  });

  it('最近 3 天穿過的另外列出，避免今天重複', () => {
    const text = summarizeFeedback([row('wore', ['t1', 'b1'], 1), row('wore', ['t2', 'b2'], 10)], names, NOW)!;
    const recent = text.split('最近 3 天穿過')[1];
    expect(recent).toContain('白T + 牛仔褲');
    expect(recent).not.toContain('黑色襯衫');
  });

  it('單品已不在衣櫃的組合略過', () => {
    expect(summarizeFeedback([row('choose', ['t1', 'deleted'])], names, NOW)).toBeNull();
  });
});
