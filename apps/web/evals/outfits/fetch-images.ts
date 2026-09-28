import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ClosetCategory } from '../../lib/closet/categories';

// 從 Hugging Face 下載考卷用的衣服照片（公開資料集 ashraq/fashion-product-images-small，
// 原始資料來自 Kaggle 的 Fashion Product Images）。照片只在本機用來測試，不要上傳到 GitHub（images/ 已被 gitignore）。
// 失敗時改用「自己放照片」（見 README）。

const DATASET = 'ashraq/fashion-product-images-small';
// 不用 /filter：它要先載入整份資料集的索引，冷門資料集常卡在 "index is loading" 十幾分鐘。
// /rows 不需要索引，資料男女裝、各類別混在一起排，逐頁讀再自己挑就夠了。
const API = 'https://datasets-server.huggingface.co/rows';
const PAGE_SIZE = 100;
const MAX_PAGES = 150; // 最多讀 1.5 萬筆（全部約 4.4 萬筆），每頁約 2 秒

const ARTICLE_TYPES: Record<'Men' | 'Women', Record<ClosetCategory, string[]>> = {
  Men: {
    top: ['Tshirts', 'Shirts', 'Sweatshirts', 'Sweaters'],
    outerwear: ['Jackets'], // Blazers 在前 1.5 萬筆裡一件男裝都沒有，只抓夾克
    bottom: ['Jeans', 'Trousers', 'Shorts', 'Track Pants'],
    shoes: ['Casual Shoes', 'Sports Shoes', 'Formal Shoes', 'Sandals'],
    accessory: ['Belts', 'Caps', 'Watches', 'Backpacks'],
    uncategorized: [],
  },
  Women: {
    top: ['Tops', 'Tshirts', 'Shirts', 'Sweaters'],
    outerwear: ['Jackets', 'Shrug'],
    bottom: ['Jeans', 'Trousers', 'Skirts', 'Shorts'],
    shoes: ['Casual Shoes', 'Heels', 'Flats', 'Sports Shoes'],
    accessory: ['Handbags', 'Belts', 'Scarves', 'Watches'],
    uncategorized: [],
  },
};

// 題目裡每類最多用到：上衣 14、外套 6、下身 10、鞋 6、配件 4，這裡多抓一些
export const DEFAULT_COUNTS: Partial<Record<ClosetCategory, number>> = { top: 20, outerwear: 10, bottom: 15, shoes: 10, accessory: 8 };

// 同一類裡各種的比重，沒列的是 1。厚上衣各給半份，比例才像真實衣櫃；
// 平均分的話上衣一半是毛衣衛衣，熱天題目常抽不到短袖
const TYPE_WEIGHT: Partial<Record<string, number>> = { Sweatshirts: 0.5, Sweaters: 0.5 };

function countForType(type: string, types: string[], total: number): number {
  const sum = types.reduce((s, t) => s + (TYPE_WEIGHT[t] ?? 1), 0);
  return Math.ceil((total * (TYPE_WEIGHT[type] ?? 1)) / sum);
}

interface Row {
  id: number;
  gender: string;
  articleType: string;
  baseColour: string;
  productDisplayName: string;
  image: { src: string };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 連續讀太快會被回 429（限流），Hugging Face 也偶爾回 5xx：每頁間隔一下，
// 碰到就照 Retry-After（沒有就 10 秒起跳加倍）等了再試
async function fetchWithBackoff(url: string, tries = 5): Promise<Response> {
  await sleep(500);
  for (let i = 0; ; i++) {
    const res = await fetch(url);
    if ((res.status !== 429 && res.status < 500) || i >= tries - 1) return res;
    const wait = Number(res.headers.get('retry-after')) * 1000 || 10_000 * 2 ** i;
    await sleep(wait);
  }
}

// 逐頁讀，把符合性別的列依 articleType 分堆；每種都湊到 wanted 張（或讀到上限）就停
async function scanRows(gender: string, wanted: Record<string, number>): Promise<Record<string, Row[]>> {
  const found: Record<string, Row[]> = Object.fromEntries(Object.keys(wanted).map((t) => [t, []]));
  for (let page = 0; page < MAX_PAGES; page++) {
    if (Object.entries(wanted).every(([t, n]) => found[t].length >= n)) break;
    const url = `${API}?dataset=${encodeURIComponent(DATASET)}&config=default&split=train&offset=${page * PAGE_SIZE}&length=${PAGE_SIZE}`;
    const res = await fetchWithBackoff(url);
    if (!res.ok) throw new Error(`Hugging Face 回 ${res.status}（第 ${page + 1} 頁）`);
    const body = (await res.json()) as { rows?: Array<{ row: Row }> };
    if (!body.rows?.length) break;
    for (const { row } of body.rows) {
      const list = found[row?.articleType];
      if (row.gender === gender && list && list.length < wanted[row.articleType] && row.image?.src) list.push(row);
    }
  }
  return found;
}

export async function fetchImages(params: {
  imagesDir: string;
  gender: 'Men' | 'Women';
  counts?: Partial<Record<ClosetCategory, number>>;
  log?: (msg: string) => void;
}) {
  const { imagesDir, gender, counts = DEFAULT_COUNTS, log = console.log } = params;
  const metaPath = join(imagesDir, 'meta.json');
  const meta: Record<string, { name: string; articleType: string; colour: string; source: string }> = existsSync(metaPath)
    ? JSON.parse(readFileSync(metaPath, 'utf8'))
    : {};

  // 每種多抓幾倍再間隔挑，避免同一個品牌、同一系列連在一起
  const wanted: Record<string, number> = {};
  for (const [category, total] of Object.entries(counts) as Array<[ClosetCategory, number]>) {
    const types = ARTICLE_TYPES[gender][category];
    if (!types?.length || !total) continue;
    for (const type of types) wanted[type] = countForType(type, types, total) * 4;
  }
  log('讀取資料集清單（逐頁讀，約 2～6 分鐘）…');
  const pool = await scanRows(gender, wanted);

  for (const [category, total] of Object.entries(counts) as Array<[ClosetCategory, number]>) {
    const types = ARTICLE_TYPES[gender][category];
    if (!types?.length || !total) continue;
    mkdirSync(join(imagesDir, category), { recursive: true });
    let saved = 0;
    for (const type of types) {
      if (saved >= total) break;
      const perType = countForType(type, types, total);
      const rows = pool[type] ?? [];
      const step = Math.max(1, Math.floor(rows.length / perType));
      for (let i = 0; i < rows.length && saved < total; i += step) {
        const row = rows[i];
        const file = `${row.id}.jpg`;
        const id = `${category}/${file}`;
        if (meta[id]) {
          saved++;
          continue;
        }
        const img = await fetch(row.image.src);
        if (!img.ok) continue;
        writeFileSync(join(imagesDir, category, file), Buffer.from(await img.arrayBuffer()));
        meta[id] = { name: row.productDisplayName, articleType: row.articleType, colour: row.baseColour, source: `${DATASET}#${row.id}` };
        saved++;
      }
    }
    writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    log(`${category}：${saved} 張`);
  }
}
