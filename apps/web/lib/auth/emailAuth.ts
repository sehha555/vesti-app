import { createClient } from '@supabase/supabase-js';
import type { AuthSessionData } from './cookies';

/**
 * Response interface for email sign-in operation
 */
export interface SignInResponse {
  success: boolean;
  session?: AuthSessionData;
}

/**
 * Sign in user with email and password
 * @param email - User email address
 * @param password - User password
 * @returns Promise with success status and optional session data
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<SignInResponse> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Auth] Missing Supabase configuration');
      return { success: false };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.session) {
      console.error('[Auth] Sign in failed:', error?.message);
      return { success: false };
    }

    const { session } = data;

    return {
      success: true,
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        userId: session.user.id,
      },
    };
  } catch (error) {
    console.error('[Auth] Unexpected error during sign in:', error);
    return { success: false };
  }
}
