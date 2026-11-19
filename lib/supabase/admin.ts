import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Privileged Supabase Admin Client using service-role key
// MUST ONLY BE CALLED FROM SECURE SERVER-SIDE CODE (Route Handlers, Server Actions)
// NEVER EXPOSE SERVICE ROLE KEY TO BROWSER CLIENTS
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!serviceRoleKey) {
    console.warn(
      '[SECURITY WARNING] SUPABASE_SERVICE_ROLE_KEY is not defined. Admin operations will fallback to standard permissions.'
    );
  }

  return createSupabaseClient(
    url,
    serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
