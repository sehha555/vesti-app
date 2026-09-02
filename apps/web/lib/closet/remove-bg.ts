const ENDPOINT = 'https://api.remove.bg/v1.0/removebg';
const TIMEOUT_MS = 20_000;

export type RemovedBg = { buffer: Buffer; contentType: string };

/**
 * 用 remove.bg 去背，把商品圖裡的人與背景去掉，只留衣服。
 *
 * UNIQLO 的商品圖多半是模特兒實穿照，顏色是對的但畫面上有人，
 * 放進衣櫃卡片會看不出是哪一件（例如牛仔褲的圖以模特兒的上衣為主視覺）。
 *
 * 沒設 key、或 API 出錯時都回 null，由呼叫端沿用原圖 —— 去背失敗不該讓整個匯入失敗。
 */
export async function removeBackground(
  buffer: Buffer,
  contentType: string
): Promise<RemovedBg | null> {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) return null;

  const form = new FormData();
  form.append('image_file', new Blob([new Uint8Array(buffer)], { type: contentType }), 'item');
  form.append('size', 'auto');
  form.append('type', 'product'); // 告訴 API 主體是商品而不是人像
  form.append('format', 'png');
  form.append('crop', 'true'); // 裁掉去背後的空白，衣服才填滿卡片

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      console.error(`[remove-bg] API 回 ${res.status}，沿用原圖`);
      return null;
    }

    const out = Buffer.from(await res.arrayBuffer());
    console.info(`[remove-bg] 去背完成 ${buffer.length} → ${out.length} bytes`);
    return { buffer: out, contentType: 'image/png' };
  } catch (err) {
    console.error('[remove-bg] 去背失敗，沿用原圖:', (err as Error).message);
    return null;
  }
}
