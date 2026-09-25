/**
 * 一套穿搭的識別碼：組成單品（closet item id）排序後串起來。
 *
 * 推薦卡片的 id 只是那次回應的順序（1、2、3），重新整理就變了；
 * 同樣幾件衣服組成的就是同一套，收藏去重、今日計畫比對都用這個。
 */
export function outfitKeyFromItemIds(ids: Array<string | null | undefined>): string | null {
  const clean = ids.filter((id): id is string => typeof id === 'string' && id.length > 0);
  return clean.length > 0 ? [...new Set(clean)].sort().join('|') : null;
}

export function outfitKeyFromSlots(
  slots: Array<{ item?: { id?: string | null } | null }> | null | undefined
): string | null {
  return outfitKeyFromItemIds((slots ?? []).map((s) => s.item?.id));
}
