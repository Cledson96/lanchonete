import { NextResponse, type NextRequest } from "next/server";
import { cookieNames } from "@/lib/config";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/dashboard/login")) {
    return NextResponse.next();
  }

  const adminCookie = request.cookies.get(cookieNames.admin)?.value;

  if (!adminCookie) {
    const loginUrl = new URL("/dashboard/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
