import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { jsonNoStore } from '@/lib/http/no-store';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { logSecurityEvent } from '@/lib/metrics';

export async function GET(request: NextRequest) {
  try {
    const { user } = await getSupabaseAndUser();

    if (!user) {
      logSecurityEvent({
        endpoint: '/api/wardrobe/items',
        statusCode: 401,
        reason: 'auth_required',
        userAgent: request.headers.get('user-agent') || '',
      });
      return jsonNoStore({ error: 'Unauthorized' }, { status: 401 });
    }

    // 使用 session user.id 作為唯一來源，不信任外部 userId 參數
    const { data, error } = await supabaseAdmin
      .from('clothing_items')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return jsonNoStore(data, { status: 200 });
  } catch (error: any) {
    console.error('Supabase GET 錯誤:', error);
    return jsonNoStore({ message: '讀取衣物資料時發生錯誤。' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const nextRequest = request as NextRequest;
    const { user } = await getSupabaseAndUser();

    if (!user) {
      logSecurityEvent({
        endpoint: '/api/wardrobe/items',
        statusCode: 401,
        reason: 'auth_required',
        userAgent: nextRequest.headers.get('user-agent') || '',
      });
      return jsonNoStore({ error: 'Unauthorized' }, { status: 401 });
    }

    const newItem = await request.json();
    const { name, type, colors } = newItem;
    const imageUrl: string | undefined = newItem.image_url ?? newItem.imageUrl;

    // 不信任外部 user_id，強制使用 session user.id
    if (!name || !type || !colors) {
      return jsonNoStore({ message: '請求中缺少必要的欄位 (name, type, colors)。' }, { status: 400 });
    }

    if (imageUrl) {
      const { data: existing, error: existingError } = await supabaseAdmin
        .from('clothing_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('image_url', imageUrl)
        .maybeSingle();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (existing) {
        return jsonNoStore(existing, { status: 200 });
      }
    }

    // 強制設置 user_id 為 session user.id
    const itemToInsert = { ...newItem, user_id: user.id, name, type, colors };

    const { data, error } = await supabaseAdmin
      .from('clothing_items')
      .insert([itemToInsert])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return jsonNoStore(data, { status: 201 });
  } catch (error: any) {
    console.error('Supabase POST 錯誤:', error);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? '新增衣物時發生錯誤。'
      : error.message;
    return jsonNoStore({ message: '新增衣物時發生錯誤。', error: errorMessage }, { status: 500 });
  }
}


export async function PUT(request: Request) {
  try {
    const nextRequest = request as NextRequest;
    const { user } = await getSupabaseAndUser();

    if (!user) {
      logSecurityEvent({
        endpoint: '/api/wardrobe/items',
        statusCode: 401,
        reason: 'auth_required',
        userAgent: nextRequest.headers.get('user-agent') || '',
      });
      return jsonNoStore({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...updateData } = await request.json();

    if (!id) {
      return jsonNoStore({ message: '缺少 id 參數' }, { status: 400 });
    }

    // 保證查詢帶有 ownership filter
    const { data, error, count } = await supabaseAdmin
      .from('clothing_items')
      .update(updateData)
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
    console.error('Supabase PUT 錯誤:', error);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? '更新衣物時發生錯誤'
      : error.message;
    return jsonNoStore({ message: '更新衣物時發生錯誤', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const nextRequest = request as NextRequest;
    const { user } = await getSupabaseAndUser();

    if (!user) {
      logSecurityEvent({
        endpoint: '/api/wardrobe/items',
        statusCode: 401,
        reason: 'auth_required',
        userAgent: nextRequest.headers.get('user-agent') || '',
      });
      return jsonNoStore({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return jsonNoStore({ message: '缺少 id 參數' }, { status: 400 });
    }

    // 保證查詢帶有 ownership filter
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

    return jsonNoStore({ message: '刪除成功' }, { status: 200 });
  } catch (error: any) {
    console.error('Supabase DELETE 錯誤:', error);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? '刪除衣物時發生錯誤'
      : error.message;
    return jsonNoStore({ message: '刪除衣物時發生錯誤', error: errorMessage }, { status: 500 });
  }
}
