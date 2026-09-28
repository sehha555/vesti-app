import type { ItemAttributes } from '../../lib/closet/attributes';
import type { OutfitSuggestion } from '../../lib/ai/outfit-prompt';
import { outfitKeyFromItemIds } from '../../lib/outfits/key';

// 考卷的「客觀規則」：不用 AI、每次結果一樣，用來檢查明顯的錯。
// 美感分數交給 judge.ts；兩個一起看，才不會只相信 AI 自己改的考卷。

export interface RuleResult {
  rule: string;
  /** 給人看的中文說明 */
  label: string;
  passed: boolean;
  detail?: string;
}

export interface RuleInput {
  outfits: OutfitSuggestion[];
  /** 模型原始給了幾套（過濾掉不合法的之前） */
  rawCount: number;
  feelsLike: number;
  occasion: string;
  /** 送給模型的候選衣物的屬性（沒辨識的是 null） */
  attributes: Map<string, ItemAttributes | null>;
  /** 使用者說過不要的組合（每個是一組單品 id） */
  dislikedCombos: string[][];
  /** 最近穿過的整套 */
  wornCombos: string[][];
}

const itemIds = (o: OutfitSuggestion) => o.layoutSlots.map((s) => s.item.id);

export function checkRules(input: RuleInput): RuleResult[] {
  const { outfits, rawCount, feelsLike, occasion, attributes } = input;
  const results: RuleResult[] = [];
  const attrsOf = (o: OutfitSuggestion) =>
    itemIds(o)
      .map((id) => attributes.get(id))
      .filter((a): a is ItemAttributes => Boolean(a));
  const names = (o: OutfitSuggestion) => o.layoutSlots.map((s) => s.item.name).join(' + ');

  results.push({
    rule: 'enough_outfits',
    label: '至少給出 2 套',
    passed: outfits.length >= 2,
    detail: `${outfits.length} 套`,
  });

  results.push({
    rule: 'all_valid',
    label: '模型給的搭配都合法（有上身和下身、沒有不存在的衣服）',
    passed: rawCount > 0 && outfits.length === rawCount,
    detail: `模型給 ${rawCount} 套，合法 ${outfits.length} 套`,
  });

  const keys = outfits.map((o) => outfitKeyFromItemIds(itemIds(o)));
  results.push({
    rule: 'distinct',
    label: '每套都不一樣',
    passed: new Set(keys).size === keys.length,
  });

  if (feelsLike >= 28) {
    const bad = outfits.filter((o) => attrsOf(o).some((a) => a.warmth >= 4));
    results.push({
      rule: 'hot_no_heavy',
      label: '熱天（體感 28 度以上）不穿保暖度 4 以上的衣服',
      passed: bad.length === 0,
      detail: bad.map(names).join('；') || undefined,
    });
  }

  if (feelsLike < 12) {
    const hasWarm = [...attributes.values()].some((a) => a && a.warmth >= 4);
    if (hasWarm) {
      const bad = outfits.filter((o) => !attrsOf(o).some((a) => a.warmth >= 4));
      results.push({
        rule: 'cold_warm_layer',
        label: '冷天（體感 12 度以下）每套都有保暖度 4 以上的衣服',
        passed: bad.length === 0,
        detail: bad.map(names).join('；') || undefined,
      });
    }
  }

  const spread = outfits.filter((o) => {
    const f = attrsOf(o).map((a) => a.formality);
    return f.length >= 2 && Math.max(...f) - Math.min(...f) > 2;
  });
  results.push({
    rule: 'formality_spread',
    label: '同一套的正式度相差不超過 2',
    passed: spread.length === 0,
    detail: spread.map(names).join('；') || undefined,
  });

  if (occasion === 'work') {
    const bad = outfits.filter((o) => attrsOf(o).some((a) => a.formality <= 1));
    results.push({
      rule: 'work_not_too_casual',
      label: '上班場合不穿正式度 1 的衣服（運動服、拖鞋）',
      passed: bad.length === 0,
      detail: bad.map(names).join('；') || undefined,
    });
  }

  if (input.dislikedCombos.length > 0) {
    const bad = outfits.filter((o) => {
      const ids = new Set(itemIds(o));
      return input.dislikedCombos.some((combo) => combo.every((id) => ids.has(id)));
    });
    results.push({
      rule: 'respect_dislike',
      label: '避開使用者說過「不要」的組合',
      passed: bad.length === 0,
      detail: bad.map(names).join('；') || undefined,
    });
  }

  if (input.wornCombos.length > 0) {
    const worn = new Set(input.wornCombos.map((c) => outfitKeyFromItemIds(c)));
    const bad = outfits.filter((o) => worn.has(outfitKeyFromItemIds(itemIds(o))));
    results.push({
      rule: 'no_repeat_worn',
      label: '不重複推薦最近穿過的整套',
      passed: bad.length === 0,
      detail: bad.map(names).join('；') || undefined,
    });
  }

  return results;
}
