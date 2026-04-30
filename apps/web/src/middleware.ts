import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// TODO: Remove DEV_BYPASS before production deployment
const DEV_BYPASS = true; // Set to false to re-enable auth checks

const PUBLIC_PATHS = ["/login", "/setup"];

export function middleware(request: NextRequest) {
  // Bypass all auth checks during frontend development
  if (DEV_BYPASS) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for refresh token cookie (presence = likely authenticated)
  const refreshToken = request.cookies.get("refreshToken")?.value;
  if (!refreshToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
