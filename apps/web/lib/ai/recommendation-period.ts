// 推薦多久重算一次（小時）。要能整除 24，時段從台灣午夜起算，例如 24 = 每天一次、6 = 00/06/12/18 各一次
export const RECOMMENDATION_REFRESH_HOURS = 24;

// 台灣固定 UTC+8、沒有夏令時間
const TAIPEI_OFFSET_MS = 8 * 3_600_000;

/** 現在所在時段的開始時間（UTC 的 Date），當作 daily_recommendations 的 period_start */
export function currentPeriodStart(now: Date = new Date(), hours: number = RECOMMENDATION_REFRESH_HOURS): Date {
  const periodMs = hours * 3_600_000;
  const localMs = now.getTime() + TAIPEI_OFFSET_MS;
  return new Date(Math.floor(localMs / periodMs) * periodMs - TAIPEI_OFFSET_MS);
}

/** 台灣今天的日期字串 YYYY-MM-DD（每日穿搭計畫用） */
export function taipeiDate(now: Date = new Date()): string {
  return new Date(now.getTime() + TAIPEI_OFFSET_MS).toISOString().slice(0, 10);
}
