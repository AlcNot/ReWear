import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import type { Database } from '@/types/database';
import { ROLE_RANK, type AppRole } from '@/types/rbac';

type CookieToSet = { name: string; value: string; options: CookieOptions };

const protectedPrefixes = ['/sell', '/profile', '/messages', '/orders', '/favorites', '/notifications'];
const authPaths = ['/login', '/signup'];
const dashboardMinimumRoles: Array<{ prefix: string; role: AppRole }> = [
  { prefix: '/admin/settings', role: 'admin' },
  { prefix: '/supervisor', role: 'lead_moderator' },
  { prefix: '/moderator', role: 'moderator' },
  { prefix: '/trusted', role: 'trusted_user' },
  { prefix: '/overview', role: 'user' }
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { pathname, search } = request.nextUrl;
  const needsAuthentication = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (needsAuthentication && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  const dashboardRoute = dashboardMinimumRoles.find((route) => pathname.startsWith(route.prefix));
  if (dashboardRoute) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('next', `${pathname}${search}`);
      return NextResponse.redirect(redirectUrl);
    }
    const { data: profile } = await supabase.from('profiles').select('role, account_status').eq('id', user.id).maybeSingle();
    if (!profile || profile.account_status === 'banned') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = profile?.account_status === 'banned' ? '/suspended' : '/login';
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl);
    }
    const requiredRole = dashboardRoute.role;
    if (ROLE_RANK[profile.role as AppRole] < ROLE_RANK[requiredRole]) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      redirectUrl.searchParams.set('error', 'dashboard_forbidden');
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (user && authPaths.includes(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
};
