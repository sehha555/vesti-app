import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export interface SupabaseAndUser {
  supabase: SupabaseClient;
  user: User | null;
}

/**
 * Creates a Supabase SSR client bound to the request cookies (anon key only).
 *
 * 所有會讀寫 session 的地方（OAuth、Email 登入/註冊、登出、資料 API）都要用這一個，
 * 才會讀寫同一組 `sb-<project-ref>-auth-token` cookie。
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from Server Component - ignore
        }
      },
    },
  });
}

/**
 * Creates a Supabase server client using anon key + user session from cookies.
 *
 * This function is designed for Next.js App Router Route Handlers.
 * It uses the anon key only - never the service_role key.
 *
 * @returns { supabase, user } where user is null if not authenticated
 *
 * @example
 * ```ts
 * export async function GET(req: NextRequest) {
 *   const { supabase, user } = await getSupabaseAndUser();
 *
 *   if (!user) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *
 *   const { data } = await supabase
 *     .from('closet_items')
 *     .select('*')
 *     .eq('user_id', user.id);
 *
 *   return NextResponse.json(data);
 * }
 * ```
 */
export async function getSupabaseAndUser(): Promise<SupabaseAndUser> {
  const supabase = await createSupabaseServerClient();

  // Use getUser() instead of getSession() for security
  // getUser() validates the JWT token with Supabase Auth server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}
