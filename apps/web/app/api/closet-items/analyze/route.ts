import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/http/require-user';
import { jsonNoStore } from '@/lib/http/no-store';
import { downloadClosetImage, storagePathFromImageUrl } from '@/lib/closet/storage';
import { closetItemColumns, DEFAULT_ITEM_NAME } from '@/lib/closet/create-item';
import { tagClosetItem } from '@/lib/ai/tag-item';
import type { ClosetCategory } from '@/lib/closet/categories';

export const runtime = 'nodejs';

const RATE_LIMIT = { keyPrefix: 'closet-analyze', maxRequests: 30, windowMs: 600_000 };
// 一次辨識幾件：每件一次 Gemini 呼叫，太多會拖到逾時
const BATCH_SIZE = 3;
// 系統自動取的名字，AI 辨識出名稱時可以換掉；使用者自己取的不動
const PLACEHOLDER_NAMES = new Set([DEFAULT_ITEM_NAME, '未命名商品']);

interface Row {
  id: string;
  name: string;
  category: ClosetCategory;
  image_url: string;
}

/**
 * POST /api/closet-items/analyze
 * 替還沒辨識過屬性的舊衣物補辨識，一次最多 BATCH_SIZE 件。前端重複呼叫直到 remaining 為 0。
 * 使用者設定過的類別與名稱不會被覆蓋。
 *
 * Returns: { analyzed, failed, remaining }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireUser(req, RATE_LIMIT);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  if (!process.env.GEMINI_API_KEY) {
    return jsonNoStore({ error: 'AI 辨識尚未設定' }, { status: 503 });
  }

  const pending = (columns: string, head = false) =>
    supabase
      .from('active_closet_items')
      .select(columns, { count: 'exact', head })
      .eq('user_id', user.id)
      .is('attributes', null)
      .not('image_url', 'is', null);

  const { data, error } = await pending('id, name, category, image_url').order('created_at', { ascending: false }).limit(BATCH_SIZE);
  if (error) {
    console.error('[closet-items/analyze] query failed:', error.message);
    return jsonNoStore({ error: '讀取衣櫃失敗' }, { status: 500 });
  }

  const results = await Promise.all(
    ((data ?? []) as unknown as Row[]).map(async (row) => {
      try {
        const image = await downloadClosetImage(supabase, storagePathFromImageUrl(row.image_url));
        const attrs = await tagClosetItem({ buffer: image.buffer, contentType: image.mimeType });
        if (!attrs) return false;
        const { error: updateError } = await supabase
          .from('closet_items')
          .update(
            closetItemColumns({ name: PLACEHOLDER_NAMES.has(row.name) ? undefined : row.name, category: row.category }, attrs)
          )
          .eq('id', row.id)
          .eq('user_id', user.id);
        if (updateError) throw new Error(updateError.message);
        return true;
      } catch (err) {
        console.error('[closet-items/analyze] item failed:', row.id, (err as Error).message);
        return false;
      }
    })
  );

  const analyzed = results.filter(Boolean).length;
  const { count } = await pending('id', true);
  return jsonNoStore({ analyzed, failed: results.length - analyzed, remaining: count ?? 0 });
}
