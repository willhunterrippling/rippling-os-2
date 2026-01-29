import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

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

  // Login page is always accessible
  const isLoginPage = pathname === "/login";

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login page
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

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
