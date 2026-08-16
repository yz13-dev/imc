import { API_URL, ASSETS_URL, AUTH_URL, SITE_URL } from "./api/const";



export function getApiUrl(path?: string) {
  return new URL(path || "/", API_URL).toString()
}

export function getAuthUrl(path?: string) {
  return new URL(path || "/", AUTH_URL).toString()
}

export function getAssetsUrl(path?: string) {
  return new URL(path || "/", ASSETS_URL).toString()
}

export function getSiteUrl(path?: string) {
  return new URL(path || "/", SITE_URL).toString()
}

// Browser-facing callers (client-side fetch, EventSource, <img src>) can't
// attach a custom Authorization header or read apps/web's httpOnly session
// cookie themselves -- they go through this app's own same-origin proxy
// (app/proxy/{api,assets}/[...path]/route.ts, shared via lib/proxy.ts)
// instead of the real backend directly. Server-side code can still use
// getApiUrl/getAssetsUrl to call the real backend directly.
export function getApiProxyUrl(path?: string) {
  const suffix = path ? (path.startsWith("/") ? path : `/${path}`) : ""
  return getSiteUrl(`/proxy/api${suffix}`)
}

export function getAssetsProxyUrl(path?: string) {
  const suffix = path ? (path.startsWith("/") ? path : `/${path}`) : ""
  return getSiteUrl(`/proxy/assets${suffix}`)
}
