import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { ROUTES } from "@/lib/constants";

// The auth middleware provided by NextAuth checks session automatically
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage =
    req.nextUrl.pathname.startsWith(ROUTES.LOGIN) ||
    req.nextUrl.pathname.startsWith(ROUTES.REGISTER);

  // Exclude API routes, TRPC, and public assets from redirects
  const isApiOrPublic =
    req.nextUrl.pathname.startsWith("/api") ||
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname === "/favicon.ico";

  if (isApiOrPublic || req.nextUrl.pathname === "/") {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isAuthPage) {
    const callbackUrl = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(
      new URL(`${ROUTES.LOGIN}?callbackUrl=${callbackUrl}`, req.nextUrl)
    );
  }

  // Redirect authenticated users trying to access login/register back to dashboard
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, req.nextUrl));
  }

  return NextResponse.next();
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
