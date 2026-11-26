import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function redirectOnCurrentOrigin(path: '/auth/reset' | '/join?expired=1' | '/login?error=recovery') {
  // Keep the browser's hostname so the session cookie survives the redirect.
  return new Response(null, { status: 303, headers: { Location: path } });
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const invite = request.nextUrl.searchParams.get('invite');
      if (invite) {
        const result = await supabase.rpc('accept_staff_invitation', {p_token: invite});
        if (result.error) return redirectOnCurrentOrigin('/join?expired=1');
      }
      return redirectOnCurrentOrigin('/auth/reset');
    }
  }
  return redirectOnCurrentOrigin('/login?error=recovery');
}
