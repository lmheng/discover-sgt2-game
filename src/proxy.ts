import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, adminConfigured, verifySessionToken } from "@/lib/server/auth";

/**
 * Guards the admin area. Route handlers re-check authorisation as well
 * (defence in depth). Proxy runs on the Node.js runtime in Next.js 16.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login" || pathname === "/api/admin/login" || pathname === "/api/admin/logout") {
    return NextResponse.next();
  }
  const ok =
    adminConfigured() &&
    verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, process.env.ADMIN_SESSION_SECRET);
  if (ok) return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
