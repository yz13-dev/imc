import { ASSETS_URL } from "@/lib/api/const";
import { createProxyHandler } from "@/lib/proxy";

const handler = createProxyHandler(ASSETS_URL);

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
