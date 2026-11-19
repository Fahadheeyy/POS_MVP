import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ijmmkomdzujuppvawugj.supabase.co';
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'sb_publishable_XWANVJc1EUedtZxtx2vQ9g_xn3OSGI9';

  return createBrowserClient(url, key);
}

// Global browser client instance
export const supabase = createClient();
