/**
 * Next.js Middleware - Route Protection for Blog8byte
 *
 * Protects /admin/* pages and /api/admin/* API routes.
 * Public routes pass through freely.
 */

import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { middlewareAuthConfig } from "~/server/auth/middleware-config";

const { auth } = NextAuth(middlewareAuthConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAdminPage = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (isAdminPage || isAdminApi) {
    const user = req.auth?.user;

    if (!user) {
      if (isAdminApi) {
        return NextResponse.json(
          { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
          { status: 401 },
        );
      }

      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    if (user.role !== "admin") {
      if (isAdminApi) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Admin access required" } },
          { status: 403 },
        );
      }

      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
