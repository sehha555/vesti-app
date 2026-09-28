import type { Part } from '@google/genai';
import { generateJson, imagePart, GEMINI_MODEL } from '../../lib/ai/gemini';
import { describeAttributes, type ItemAttributes } from '../../lib/closet/attributes';
import { STYLE_GUIDE, type OutfitSuggestion } from '../../lib/ai/outfit-prompt';
import type { WeatherSummary } from '../../../../packages/types/src/weather';

// 評審：跟「搭配的 AI」分開的評分標準，溫度 0 讓分數穩定。
// 最好用不同的模型（GEMINI_JUDGE_MODEL），避免「學生改自己的考卷」。
export const JUDGE_MODEL = process.env.GEMINI_JUDGE_MODEL || GEMINI_MODEL;

const JUDGE_SYSTEM_PROMPT = `你是嚴格的日系簡約穿搭評審，評分對象是 AI 造型師替使用者從自己衣櫃挑的搭配。你不是造型師，不要替它辯護，只依下面的守則與給分標準評分。
使用者的品味很挑，覺得「還可以」的搭配在他眼裡就是不好看，寧可給低分也不要給人情分。

守則（跟造型師看到的是同一份）：
${STYLE_GUIDE}

另外檢查天氣：體感 28 度以上不該有厚重或長袖保暖衣物；20 度以下要夠暖；下雨避免淺色下身。

給分（1 到 5 的整數），從 3 分起評：
5 = 可以直接放進 UNIQLO／MUJI 型錄當範例，挑不出毛病
4 = 好看且完全符合守則，只有很小的地方可以更好
3 = 能穿但普通、沒有記憶點，或有一個小缺點
2 = 違反守則任一條（有印花或大 logo、非中性色當主色、超過 3 色、正式度衝突、窄管緊身褲等過時版型、寬上寬下卻沒有腰線、場合或天氣不對）
1 = 違反兩條以上，或整套看起來很奇怪
違反任一條守則，最高只能給 2 分。

reasons 用繁體中文，每點一句、具體（提到哪一件、什麼顏色）。problems 只列會扣分的問題，並寫出違反的是守則哪一段（例如「配色：紅色衛衣當主色」），沒有就給空陣列。`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    outfits: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          index: { type: 'integer' },
          score: { type: 'integer', minimum: 1, maximum: 5 },
          reasons: { type: 'array', items: { type: 'string' } },
          problems: { type: 'array', items: { type: 'string' } },
        },
        required: ['index', 'score', 'reasons', 'problems'],
      },
    },
  },
  required: ['outfits'],
};

export interface JudgeVerdict {
  index: number;
  score: number;
  reasons: string[];
  problems: string[];
}

export interface JudgeItem {
  name: string;
  attributes: ItemAttributes | null;
  image: { base64: string; mimeType: string };
}

/** 把評審回傳整理成每套一筆；缺的、分數不合法的丟掉 */
export function normalizeVerdicts(raw: unknown, outfitCount: number): JudgeVerdict[] {
  const list = (raw as { outfits?: unknown[] })?.outfits;
  if (!Array.isArray(list)) return [];
  const byIndex = new Map<number, JudgeVerdict>();
  for (const v of list as Array<Partial<JudgeVerdict>>) {
    const index = Number(v?.index);
    const score = Number(v?.score);
    if (!Number.isInteger(index) || index < 1 || index > outfitCount || byIndex.has(index)) continue;
    if (!Number.isInteger(score) || score < 1 || score > 5) continue;
    byIndex.set(index, {
      index,
      score,
      reasons: Array.isArray(v.reasons) ? v.reasons.map(String) : [],
      problems: Array.isArray(v.problems) ? v.problems.map(String) : [],
    });
  }
  return [...byIndex.values()].sort((a, b) => a.index - b.index);
}

/** 一次評完一個情境的所有搭配；只送被選中的衣服照片 */
export async function judgeOutfits(params: {
  outfits: OutfitSuggestion[];
  items: Map<string, JudgeItem>;
  weather: WeatherSummary;
  occasion: string;
}): Promise<JudgeVerdict[]> {
  const { outfits, items, weather, occasion } = params;
  if (outfits.length === 0) return [];

  const parts: Part[] = [
    {
      text: `今天天氣：${weather.condition}，氣溫 ${weather.temperature} 度，體感 ${weather.feelsLike} 度，濕度 ${weather.humidity}%。\n場合：${occasion}。\n以下共 ${outfits.length} 套：`,
    },
  ];
  outfits.forEach((outfit, i) => {
    parts.push({ text: `\n第 ${i + 1} 套（index ${i + 1}）：「${outfit.styleName}」，造型師的理由：${outfit.description}${outfit.howToWear ? `；穿法：${outfit.howToWear}` : ''}` });
    for (const slot of outfit.layoutSlots) {
      const item = items.get(slot.item.id);
      if (!item) continue;
      parts.push({ text: `${slot.slotKey}：${item.name}${item.attributes ? `（${describeAttributes(item.attributes)}）` : ''}` });
      parts.push(imagePart(item.image.base64, item.image.mimeType));
    }
  });
  parts.push({ text: '請逐套評分。' });

  const raw = await generateJson<unknown>(JUDGE_SYSTEM_PROMPT, parts, RESPONSE_SCHEMA, {
    temperature: 0,
    model: JUDGE_MODEL,
  });
  return normalizeVerdicts(raw, outfits.length);
}
