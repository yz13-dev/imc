import { API_URL } from "@/lib/api/const";
import { createProxyHandler } from "@/lib/proxy";

// GET/EventSource connections stay open for the SSE endpoint -- don't cap
// this route's duration the way default serverless limits would.
export const maxDuration = 300;

const handler = createProxyHandler(API_URL);

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
