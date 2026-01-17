import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { jsonNoStore } from '@/lib/http/no-store';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { logSecurityEvent } from '@/lib/metrics';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/wardrobe/items/{id}:
 *   get:
 *     summary: 取得單一衣物資料
 *     description: 根據衣物 ID 從 Supabase 查詢特定衣物的詳細資料。
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 衣物的 UUID。
 *     responses:
 *       200:
 *         description: 成功取得衣物資料。
 *       404:
 *         description: 找不到指定的衣物。
 *       500:
 *         description: 伺服器內部錯誤。
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { user } = await getSupabaseAndUser();

  if (!user) {
    logSecurityEvent({
      endpoint: '/api/wardrobe/items/[id]',
      statusCode: 401,
      reason: 'auth_required',
      userAgent: request.headers.get('user-agent') || '',
    });
    return jsonNoStore({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('clothing_items')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return jsonNoStore({ message: '找不到指定的衣物。' }, { status: 404 });
    }

    return jsonNoStore(data, { status: 200 });
  } catch (error: any) {
    console.error(`Supabase GET /items/${id} 錯誤:`, error);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? '讀取衣物時發生錯誤。'
      : error.message;
    return jsonNoStore({ message: '讀取衣物時發生錯誤。', error: errorMessage }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/wardrobe/items/{id}:
 *   put:
 *     summary: 更新指定的衣物
 *     description: 根據 ID 更新 Supabase 中特定衣物的資料。
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 衣物的 UUID。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWardrobeItemDto'
 *     responses:
 *       200:
 *         description: 成功更新衣物。
 *       404:
 *         description: 找不到要更新的衣物。
 *       500:
 *         description: 伺服器內部錯誤。
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { user } = await getSupabaseAndUser();

  if (!user) {
    logSecurityEvent({
      endpoint: '/api/wardrobe/items/[id]',
      statusCode: 401,
      reason: 'auth_required',
      userAgent: request.headers.get('user-agent') || '',
    });
    return jsonNoStore({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const updates = await request.json();
    delete updates.id;
    delete updates.user_id;

    const { data, error } = await supabaseAdmin
      .from('clothing_items')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return jsonNoStore({ message: '找不到要更新的衣物。' }, { status: 404 });
    }

    return jsonNoStore(data, { status: 200 });
  } catch (error: any) {
    console.error(`Supabase PUT /items/${id} 錯誤:`, error);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? '更新衣物時發生錯誤。'
      : error.message;
    return jsonNoStore({ message: '更新衣物時發生錯誤。', error: errorMessage }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/wardrobe/items/{id}:
 *   delete:
 *     summary: 刪除指定的衣物
 *     description: 根據 ID 從 Supabase 刪除特定衣物。
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 衣物的 UUID。
 *     responses:
 *       200:
 *         description: 成功刪除衣物。
 *       404:
 *         description: 找不到要刪除的衣物。
 *       500:
 *         description: 伺服器內部錯誤。
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { user } = await getSupabaseAndUser();

  if (!user) {
    logSecurityEvent({
      endpoint: '/api/wardrobe/items/[id]',
      statusCode: 401,
      reason: 'auth_required',
      userAgent: request.headers.get('user-agent') || '',
    });
    return jsonNoStore({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { error, count } = await supabaseAdmin
      .from('clothing_items')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    if (count === 0) {
      return jsonNoStore({ message: '找不到要刪除的衣物。' }, { status: 404 });
    }

    return jsonNoStore({ message: '衣物已成功刪除。' }, { status: 200 });
  } catch (error: any) {
    console.error(`Supabase DELETE /items/${id} 錯誤:`, error);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? '刪除衣物時發生錯誤。'
      : error.message;
    return jsonNoStore({ message: '刪除衣物時發生錯誤。', error: errorMessage }, { status: 500 });
  }
}
