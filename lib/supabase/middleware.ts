import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh/verify auth session locally via JWKS (zero round-trip after initial JWKS cache)
  let user = null;
  try {
    const { data } = await supabase.auth.getClaims();
    user = data?.claims?.sub ?? null;
  } catch {
    // Supabase cloud unreachable or credentials missing
  }

  const pathname = request.nextUrl.pathname;
  const isDemoRoute = process.env.NODE_ENV === 'development' && pathname === '/demo/admin';
  const publicRoutes = ['/join', '/pickup', '/', '/login', '/auth/callback', '/auth/reset', '/ui-kit', '/access-denied'];
  const isAuthRoute = isDemoRoute || publicRoutes.includes(pathname);

  // If user is not signed in and trying to access a protected route
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const redirect = NextResponse.redirect(url);
    for (const cookie of supabaseResponse.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  return supabaseResponse;
}
