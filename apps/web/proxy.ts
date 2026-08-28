import { auth } from "@/lib/auth";

export const proxy = auth.middleware();

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/inbox/:path*",
    "/trash/:path*",
    "/new/:path*",
    "/ref/:path*",
    "/((?!auth/)[^/]+/[^/]+)",
    "/((?!auth/)[^/]+/[^/]+/[^/]+)",
  ],
};
