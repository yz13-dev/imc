import { auth } from "@/lib/auth";

export const proxy = auth.middleware();

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/inbox/:path*",
    "/trash/:path*",
    "/new/:path*",
    "/:id",
    "/collection/:path*",
    "/((?!auth/)[^/]+/[^/]+)",
    "/((?!auth/)[^/]+/[^/]+/[^/]+)",
    // All API proxy calls (/api/v1/my/attachments/..., /api/assets/:id, ...)
    // need to hit this too, not just page navigations -- otherwise the
    // access token cookie expires silently while the SPA is idle on a page,
    // and every attachment fetch starts 401'ing until a full reload.
    "/api/:path*",
  ],
};
