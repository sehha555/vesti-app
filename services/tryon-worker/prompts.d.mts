// prompts.mjs 的型別（worker 是純 JS 方便桌機直接用 node 跑；測試是 TS，需要這份宣告）
export interface TryonItem {
  slotKey: string;
  name: string;
  fit?: string;
}

export type TryonRef = { kind: 'person' } | { kind: 'flat'; index: number } | { kind: 'shape'; index: number };

export const FIT_INSTRUCTION: string;
export function flatSize(slotKey: string): { w: number; h: number };
export function extractPrompt(item: { name: string; fit?: string }): string;
export function buildTryonPlan(items: TryonItem[]): { prompt: string; refs: TryonRef[] };
