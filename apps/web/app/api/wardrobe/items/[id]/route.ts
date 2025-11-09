import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../../lib/supabaseClient';

interface RouteParams {
  params: { id: string };
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
  const { id } = params;

  try {
    const { data, error } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ message: '找不到指定的衣物。' }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error(`Supabase GET /items/${id} 錯誤:`, error);
    return NextResponse.json({ message: '讀取衣物時發生錯誤。', error: error.message }, { status: 500 });
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
  const { id } = params;
  
  try {
    const updates = await request.json();
    delete updates.id;
    delete updates.user_id;

    const { data, error } = await supabase
      .from('clothing_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ message: '找不到要更新的衣物。' }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error(`Supabase PUT /items/${id} 錯誤:`, error);
    return NextResponse.json({ message: '更新衣物時發生錯誤。', error: error.message }, { status: 500 });
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
  const { id } = params;

  try {
    const { error, count } = await supabase
      .from('clothing_items')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) {
      throw error;
    }

    if (count === 0) {
      return NextResponse.json({ message: '找不到要刪除的衣物。' }, { status: 404 });
    }

    return NextResponse.json({ message: '衣物已成功刪除。' }, { status: 200 });
  } catch (error: any) {
    console.error(`Supabase DELETE /items/${id} 錯誤:`, error);
    return NextResponse.json({ message: '刪除衣物時發生錯誤。', error: error.message }, { status: 500 });
  }
}
