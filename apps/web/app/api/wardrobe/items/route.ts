import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 直接在這裡初始化 supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ message: '請求中缺少有效的 userId 參數。' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Supabase GET 錯誤:', error);
    return NextResponse.json({ message: '讀取衣物資料時發生錯誤。', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newItem = await request.json();
    const { user_id, name, type, colors } = newItem;
    const imageUrl: string | undefined = newItem.image_url ?? newItem.imageUrl;

    if (!user_id || !name || !type || !colors) {
      return NextResponse.json({ message: '請求中缺少必要的欄位 (user_id, name, type, colors)。' }, { status: 400 });
    }

    if (imageUrl) {
      const { data: existing, error: existingError } = await supabase
        .from('clothing_items')
        .select('id')
        .eq('user_id', user_id)
        .eq('image_url', imageUrl)
        .maybeSingle();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (existing) {
        return NextResponse.json(existing, { status: 200 });
      }
    }

    const { data, error } = await supabase
      .from('clothing_items')
      .insert([newItem])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Supabase POST 錯誤:', error);
    return NextResponse.json({ message: '新增衣物時發生錯誤。', error: error.message }, { status: 500 });
  }
}


export async function PUT(request: Request) {
  try {
    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json({ message: '缺少 id 參數' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('clothing_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Supabase PUT 錯誤:', error);
    return NextResponse.json({ message: '更新衣物時發生錯誤', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: '缺少 id 參數' }, { status: 400 });
    }

    const { error } = await supabase
      .from('clothing_items')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: '刪除成功' }, { status: 200 });
  } catch (error: any) {
    console.error('Supabase DELETE 錯誤:', error);
    return NextResponse.json({ message: '刪除衣物時發生錯誤', error: error.message }, { status: 500 });
  }
}
