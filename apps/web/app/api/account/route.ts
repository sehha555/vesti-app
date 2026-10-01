import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/http/require-user';
import { jsonNoStore } from '@/lib/http/no-store';
import { clearAuthCookies } from '@/lib/auth/cookies';
import { removeAllUserImages } from '@/lib/closet/storage';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { DELETE_ACCOUNT_CONFIRMATION } from '@/lib/account/constants';

export const runtime = 'nodejs';

const RATE_LIMIT = { keyPrefix: 'account-delete', maxRequests: 3, windowMs: 600_000 };

// 這兩張表沒有對 auth.users 設 on delete cascade，要自己刪；
// closet_items、daily_outfit_plans、outfit_feedback 會隨帳號一起被 cascade 刪掉
const NON_CASCADING_TABLES = ['saved_outfits', 'clothing_items'] as const;

/**
 * DELETE /api/account
 * 刪除帳號與所有資料：衣櫃照片（含去背圖）→ 沒有 cascade 的資料表 → auth 帳號（其餘表 cascade）。
 * Body: { confirm: "DELETE" }，避免誤觸或被其他頁面順手呼叫。
 *
 * 照片與資料列用本人的 client 刪（RLS / storage policy 保證只碰得到自己的）；
 * 只有最後刪 auth 帳號需要 service role。中途失敗會回 500，帳號仍在，可以重試。
 */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const auth = await requireUser(req, RATE_LIMIT);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  let body: { confirm?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // 沒 body 當作沒確認
  }
  if (body?.confirm !== DELETE_ACCOUNT_CONFIRMATION) {
    return jsonNoStore({ error: '請確認要刪除帳號' }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[account] SUPABASE_SERVICE_ROLE_KEY not configured');
    return jsonNoStore({ error: '目前無法刪除帳號，請聯絡客服' }, { status: 503 });
  }

  try {
    await removeAllUserImages(supabase, user.id);
  } catch (err) {
    console.error('[account] remove images failed:', (err as Error).message);
    return jsonNoStore({ error: '刪除照片失敗，請稍後再試' }, { status: 500 });
  }

  for (const table of NON_CASCADING_TABLES) {
    const { error } = await supabase.from(table).delete().eq('user_id', user.id);
    if (error) {
      console.error(`[account] delete ${table} failed:`, error.message);
      return jsonNoStore({ error: '刪除資料失敗，請稍後再試' }, { status: 500 });
    }
  }

  const { error: deleteUserError } = await getSupabaseAdmin().auth.admin.deleteUser(user.id);
  if (deleteUserError) {
    console.error('[account] delete auth user failed:', deleteUserError.message);
    return jsonNoStore({ error: '刪除帳號失敗，請稍後再試' }, { status: 500 });
  }

  // 帳號已刪，refresh token 跟著失效；signOut 只為了清掉 SSR 的 session cookie，失敗不影響結果
  await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);

  const response = jsonNoStore({ ok: true });
  clearAuthCookies(response.cookies);
  return response;
}
