import { generateJson, imagePart } from '../ai/gemini';

/** 候選圖：候選網址與已下載的內容 */
export type ImageCandidate = {
  url: string;
  buffer: Buffer;
  contentType: string;
};

const SYSTEM_PROMPT = `你在幫使用者的數位衣櫃挑商品圖。
會給你同一件商品的數張圖，請挑出最適合當衣櫃縮圖的那一張。

挑選順序：
1. 只有衣服本身、沒有人的平拍照（白底或淺色純背景）最好。
2. 沒有平拍照時，挑衣服佔畫面最大、最看得清版型的那張。
3. 同樣是平拍照時，挑顏色與第 1 張主圖最接近的（第 1 張代表這件商品的主要顏色）。

index 從 0 開始，照給你的順序。`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    index: { type: 'integer' },
    isFlatLay: { type: 'boolean' },
  },
  required: ['index', 'isFlatLay'],
} as const;

/**
 * 從同一件商品的多張圖裡挑一張當衣櫃縮圖。
 *
 * UNIQLO 的圖片編號同時混著「模特兒照 / 平拍照」與不同顏色，沒有固定規則可推，
 * 所以交給模型看圖判斷。只有一張候選、或模型出錯時，都退回第一張（原本的行為）。
 */
export async function pickFlatImage(candidates: ImageCandidate[]): Promise<ImageCandidate> {
  if (candidates.length <= 1) return candidates[0];

  const parts = candidates.flatMap((c, i) => [
    { text: `第 ${i + 1} 張（index ${i}）：` },
    imagePart(c.buffer.toString('base64'), c.contentType),
  ]);

  try {
    const picked = await generateJson<{ index: number; isFlatLay: boolean }>(
      SYSTEM_PROMPT,
      parts,
      RESPONSE_SCHEMA as unknown as Record<string, unknown>
    );
    const chosen = candidates[picked.index];
    console.info(
      `[pick-flat-image] 候選 ${candidates.length} 張，選 index=${picked.index} 平拍=${picked.isFlatLay}`
    );
    return chosen ?? candidates[0];
  } catch (err) {
    console.error('[pick-flat-image] 挑圖失敗，退回第一張:', (err as Error).message);
    return candidates[0];
  }
}
