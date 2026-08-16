import { AUTH_SESSION_COOKIE } from "@/lib/auth";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

// apps/web's own session cookie (set by @yz13/auth-sdk) is scoped to this
// app's domain and httpOnly -- browser contexts that can't attach a custom
// Authorization header (EventSource, <img src>) or read the cookie
// themselves (client-side fetch) hit this same-origin proxy instead. It's
// the only place that reads the raw session token and forwards it as
// `Authorization: Bearer` to the real backend, which the extension's
// forwarding fix already supports on the Go side.
export function createProxyHandler(base: string) {
  return async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;

    const search = request.nextUrl.search;
    const url = new URL(`/${path.join("/")}${search}`, base);

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("cookie");

    const token = (await cookies()).get(AUTH_SESSION_COOKIE)?.value;
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const hasBody = !["GET", "HEAD"].includes(request.method);

    const upstream = await fetch(url, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      // @ts-expect-error -- required by undici when streaming a request body
      duplex: hasBody ? "half" : undefined,
      redirect: "manual",
    });

    const responseHeaders = new Headers(upstream.headers);
    // Same-origin now (browser talks to apps/web, not the real backend
    // directly), so CORS headers from upstream would just be misleading.
    responseHeaders.delete("access-control-allow-origin");
    responseHeaders.delete("access-control-allow-credentials");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  }
}
