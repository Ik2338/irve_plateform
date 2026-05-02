import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES: { pattern: RegExp; roles: string[] }[] = [
  { pattern: /^\/admin(\/.*)?$/, roles: ['ADMIN'] },
  { pattern: /^\/dashboard\/installer(\/.*)?$/, roles: ['INSTALLER', 'ADMIN'] },
  { pattern: /^\/dashboard(\/.*)?$/, roles: ['CLIENT', 'INSTALLER', 'ADMIN'] },
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const matched = PROTECTED_ROUTES.find(r => r.pattern.test(pathname));
  if (!matched) return NextResponse.next();

  // Lire le token depuis les cookies (à préférer au localStorage, inaccessible côté serveur)
  const token = request.cookies.get('irve_token')?.value;
  const userRaw = request.cookies.get('irve_user')?.value;

  if (!token || !userRaw) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const user = JSON.parse(decodeURIComponent(userRaw));
    if (!matched.roles.includes(user.role)) {
      // Rôle insuffisant → rediriger vers le bon dashboard
      if (user.role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url));
      if (user.role === 'INSTALLER') return NextResponse.redirect(new URL('/dashboard/installer', request.url));
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } catch {
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
