// This file should only be used on the server
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Ensure this file is only used on the server
if (typeof window !== 'undefined') {
  throw new Error('supabaseClient.ts must only be used on the server');
}

let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Get Supabase Admin Client (server-only)
 * Uses service role key for admin operations
 * WARNING: Never expose this client to the browser
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      // Return a stub for build time
      return {
        from: () => ({
          select: () => ({ eq: () => ({ data: null, error: null }) }),
          insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
          update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
          delete: () => ({ eq: () => ({ data: null, error: null, count: 0 }) }),
        }),
        auth: {
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        },
      } as any;
    }

    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return _supabaseAdmin;
}

// Export as named export for direct import
export const supabaseAdmin = getSupabaseAdmin();
