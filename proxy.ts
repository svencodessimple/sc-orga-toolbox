import { NextRequestWithAuth, withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';

const authProxyHandler = withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const { pathname } = req.nextUrl;

        if (!token) return;

        const userStatus = token.status as string;
        const userRole = token.role as string;

        // 1. SCHUTZ-LOGIK: User ist permanent gesperrt (BANNED)
        if (userStatus === 'BANNED') {
            if (pathname !== '/login') {
                return NextResponse.redirect(new URL('/login?error=Banned', req.url));
            }
            return NextResponse.next();
        }

        // 2. SCHUTZ-LOGIK: User ist REJECTED
        if (userStatus === 'REJECTED') {
            if (pathname !== '/login') {
                return NextResponse.redirect(new URL('/login?error=Rejected', req.url));
            }
            return NextResponse.next();
        }

        // 3. SCHUTZ-LOGIK: Nur PENDING-User müssen warten
        if (userStatus === 'PENDING') {
            if (pathname !== '/waiting') {
                return NextResponse.redirect(new URL('/waiting', req.url));
            }
            return NextResponse.next();
        }

        // 4. VERIFIED-GUEST: Dashboard und App-Zugriff erlauben,
        // aber Admin-Routen bleiben gesperrt.
        if (userStatus === 'VERIFIED' && userRole === 'GUEST') {
            if (pathname === '/waiting') {
                return NextResponse.redirect(new URL('/dashboard', req.url));
            }

            if (pathname.startsWith('/admin')) {
                return NextResponse.redirect(new URL('/dashboard', req.url));
            }

            return NextResponse.next();
        }

        // 5. SCHUTZ-LOGIK: Wenn ein ACTIVE-User versucht, auf /waiting zuzugreifen
        if (userStatus === 'ACTIVE' && pathname === '/waiting') {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        // 6. ADMIN-ROUTEN-SCHUTZ: Nur User mit Role.ADMIN dürfen auf /admin zugreifen
        if (pathname.startsWith('/admin')) {
            if (userRole !== 'ADMIN') {
                return NextResponse.redirect(new URL('/dashboard', req.url));
            }
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

// Next.js 16 erwartet jetzt entweder einen Default-Export oder eine Funktion namens 'proxy'
export default async function proxy(req: NextRequest, event: NextFetchEvent) {
    // Wir leiten den Request einfach an den NextAuth Handler weiter
    return authProxyHandler(req as NextRequestWithAuth, event);
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|register).*)'],
};
