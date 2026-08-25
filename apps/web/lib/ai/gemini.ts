import { GoogleGenAI, type Part } from '@google/genai';

// 模型名稱可用 env 覆蓋；預設用穩定版 Flash（有免費額度、支援圖片輸入）
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.7-flash';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

/**
 * 叫模型回固定形狀的 JSON。parts 可混文字與 inlineData 圖片。
 */
export async function generateJson<T>(
  systemInstruction: string,
  parts: Part[],
  responseJsonSchema: Record<string, unknown>
): Promise<T> {
  const response = await getClient().models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseJsonSchema,
      temperature: 0.7,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Gemini returned empty response');
  return JSON.parse(text) as T;
}

export function imagePart(base64: string, mimeType: string): Part {
  return { inlineData: { data: base64, mimeType } };
}
