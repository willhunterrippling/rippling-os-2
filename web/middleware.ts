import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge-compatible middleware for basic auth route protection.
 * Checks for session cookie presence only - actual validation
 * happens server-side where Prisma is available.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow auth API routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // In development with BYPASS_AUTH, skip auth check
  if (
    process.env.NODE_ENV === "development" &&
    process.env.BYPASS_AUTH === "true"
  ) {
    return NextResponse.next();
  }

  // Check for NextAuth session cookie
  const sessionCookie =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token");

  const isLoggedIn = !!sessionCookie;
  const isLoginPage = pathname === "/login";

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login page
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export default middleware;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
