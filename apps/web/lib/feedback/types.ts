// 推薦回饋的共用定義：API、首頁卡片、Gemini prompt 都用這一份

export const FEEDBACK_ACTIONS = ['choose', 'unchoose', 'dislike', 'skip', 'save', 'unsave', 'wore', 'not_worn'] as const;
export type FeedbackAction = (typeof FEEDBACK_ACTIONS)[number];

/** 「不要這套」的原因，value 存 DB、label 給畫面、prompt 給模型 */
export const DISLIKE_REASONS = [
  { value: 'color', label: '配色不喜歡', prompt: '配色不喜歡' },
  { value: 'style', label: '不是我的風格', prompt: '風格不合' },
  { value: 'weather', label: '不適合今天天氣', prompt: '不適合當天天氣' },
  { value: 'occasion', label: '不適合今天場合', prompt: '不適合場合' },
  { value: 'too_formal', label: '太正式', prompt: '太正式' },
  { value: 'too_casual', label: '太隨便', prompt: '太隨便' },
  { value: 'recent', label: '最近才穿過', prompt: '最近才穿過' },
] as const;
export type DislikeReason = (typeof DISLIKE_REASONS)[number]['value'];
export const DISLIKE_REASON_VALUES = DISLIKE_REASONS.map((r) => r.value) as [DislikeReason, ...DislikeReason[]];
