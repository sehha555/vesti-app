import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL 或 Anon Key 未在 .env.local 中設定 (需要 NEXT_PUBLIC_ 前綴)');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
