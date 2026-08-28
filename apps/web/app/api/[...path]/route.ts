import { API_URL, ASSETS_URL } from "@/lib/api/const";
import { createProxyHandler } from "@/lib/proxy";
import type { NextRequest } from "next/server";

// GET/EventSource connections stay open for the SSE endpoint -- don't cap
// this route's duration the way default serverless limits would.
export const maxDuration = 300;

const apiHandler = createProxyHandler(API_URL);
const assetsHandler = createProxyHandler(ASSETS_URL);

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;

  if (path[0] === "assets") {
    return assetsHandler(request, {
      params: Promise.resolve({ path: ["v1", "attachments", path[1], "file"] }),
    });
  }

  return apiHandler(request, context);
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
