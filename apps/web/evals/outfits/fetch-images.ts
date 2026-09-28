import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ClosetCategory } from '../../lib/closet/categories';

// 從 Hugging Face 下載考卷用的衣服照片（公開資料集 ashraq/fashion-product-images-small，
// 原始資料來自 Kaggle 的 Fashion Product Images）。照片只在本機用來測試，不要上傳到 GitHub（images/ 已被 gitignore）。
// ⚠ 寫這支程式的雲端環境連不到 Hugging Face，這支沒有實際跑過；失敗時改用「自己放照片」（見 README）。

const DATASET = 'ashraq/fashion-product-images-small';
const API = 'https://datasets-server.huggingface.co/filter';

const ARTICLE_TYPES: Record<'Men' | 'Women', Record<ClosetCategory, string[]>> = {
  Men: {
    top: ['Tshirts', 'Shirts', 'Sweatshirts', 'Sweaters'],
    outerwear: ['Jackets', 'Blazers'],
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

interface Row {
  id: number;
  articleType: string;
  baseColour: string;
  productDisplayName: string;
  image: { src: string };
}

async function queryRows(gender: string, articleType: string, length: number): Promise<Row[]> {
  const where = `"gender"='${gender}' AND "articleType"='${articleType}'`;
  const url = `${API}?dataset=${encodeURIComponent(DATASET)}&config=default&split=train&where=${encodeURIComponent(where)}&offset=0&length=${length}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Hugging Face 回 ${res.status}（${articleType}）`);
  const body = (await res.json()) as { rows?: Array<{ row: Row }> };
  return (body.rows ?? []).map((r) => r.row).filter((r) => r?.image?.src);
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

  for (const [category, total] of Object.entries(counts) as Array<[ClosetCategory, number]>) {
    const types = ARTICLE_TYPES[gender][category];
    if (!types?.length || !total) continue;
    mkdirSync(join(imagesDir, category), { recursive: true });
    const perType = Math.ceil(total / types.length);
    let saved = 0;
    for (const type of types) {
      if (saved >= total) break;
      // 多抓幾倍再間隔挑，避免同一個品牌、同一系列連在一起
      const rows = await queryRows(gender, type, perType * 4);
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
