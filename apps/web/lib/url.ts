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
