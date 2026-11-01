// The proxy only does optimistic redirects. It never touches tokens.
//
// Refreshing lives in the browser (see `app/components/session-keeper.tsx`).
// The browser is the only place that can (a) write cookies onto the response
// the user is actually waiting for, and (b) coordinate parallel requests, so
// the refresh race simply cannot happen there.

import { NextResponse, type NextRequest } from "next/server";

import { REFRESH_TOKEN_COOKIE_KEY } from "@/lib/cookie-config";

const AUTH_PREFIX = "/auth";
const PROTECTED_PREFIX = "/dashboard";
const LOGIN_URL = "/auth/login";
const DASHBOARD_URL = "/dashboard";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The refresh token is the real session: the access token comes and goes
  // every 14 minutes, the refresh token lasts 7 days.
  const isLoggedIn = request.cookies.has(REFRESH_TOKEN_COOKIE_KEY);

  if (pathname.startsWith(PROTECTED_PREFIX) && !isLoggedIn) {
    return NextResponse.redirect(new URL(LOGIN_URL, request.url));
  }

  if (pathname.startsWith(AUTH_PREFIX) && isLoggedIn) {
    return NextResponse.redirect(new URL(DASHBOARD_URL, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Every page route. `api` is excluded so /api/auth/refresh is never proxied,
  // and static assets are excluded so a missing image never runs auth logic.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|txt|xml|woff|woff2|ttf|otf)$).*)",
  ],
};
