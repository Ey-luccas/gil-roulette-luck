import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE_NAME, parseAdminSessionToken } from "@/lib/admin-session";

function buildLoginRedirectUrl(request: NextRequest) {
  const loginUrl = new URL("/admin/login", request.url);
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set("next", requestedPath);
  return loginUrl;
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = parseAdminSessionToken(token);

  if (!session) {
    return NextResponse.redirect(buildLoginRedirectUrl(request));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*", "/admin/clientes/:path*", "/admin/pecas/:path*"],
};
