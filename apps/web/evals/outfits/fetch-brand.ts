import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { knownProductImages } from '../../lib/closet/og';
import { pickFlatImage, type ImageCandidate } from '../../lib/closet/pick-flat-image';

// 從 UNIQLO / GU 台灣官網下載 brand-items.json 列的商品圖（日系簡約基本款）。
// 一件商品有 4 張圖（模特兒照、平拍照混在一起），跟 App 匯入一樣交給 pickFlatImage 挑一張。
// 照片只在本機用來測試，不要上傳到 GitHub（images/ 已被 gitignore）。

interface BrandItem {
  category: string;
  brand: 'uniqlo' | 'gu';
  code: string;
  name: string;
}

// Gemini 免費方案每分鐘最多 15 次，挑圖之間要隔開
const PICK_INTERVAL_MS = 4500;

// GU 台灣跟 UNIQLO 同一套商品頁系統，圖片路徑一樣、只差網域
function candidateUrls(item: BrandItem): string[] {
  const urls = knownProductImages(`https://www.uniqlo.com/tw/zh_TW/product-detail.html?productCode=${item.code}`);
  return item.brand === 'gu' ? urls.map((u) => u.replace('www.uniqlo.com', 'www.gu-global.com')) : urls;
}

export async function fetchBrandImages(params: { imagesDir: string; itemsPath: string; log?: (msg: string) => void }) {
  const { imagesDir, itemsPath, log = console.log } = params;
  const { items } = JSON.parse(readFileSync(itemsPath, 'utf8')) as { items: BrandItem[] };
  const metaPath = join(imagesDir, 'meta.json');
  const meta: Record<string, { name: string; articleType: string; colour: string; source: string }> = existsSync(metaPath)
    ? JSON.parse(readFileSync(metaPath, 'utf8'))
    : {};

  let picked = 0;
  for (const item of items) {
    const id = `${item.category}/${item.code}.jpg`;
    if (meta[id]) continue;

    const candidates: ImageCandidate[] = [];
    for (const url of candidateUrls(item)) {
      const res = await fetch(url);
      if (!res.ok) continue;
      candidates.push({ url, buffer: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get('content-type') ?? 'image/jpeg' });
    }
    if (candidates.length === 0) {
      log(`  跳過 ${item.name}（${item.code}）：抓不到圖`);
      continue;
    }

    if (picked > 0) await new Promise((r) => setTimeout(r, PICK_INTERVAL_MS));
    const chosen = await pickFlatImage(candidates);
    picked++;

    mkdirSync(join(imagesDir, item.category), { recursive: true });
    writeFileSync(join(imagesDir, item.category, `${item.code}.jpg`), chosen.buffer);
    meta[id] = { name: item.name, articleType: item.category, colour: '', source: chosen.url };
    writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    log(`  ${item.category}：${item.name}`);
  }
}
