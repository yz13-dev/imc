import { API_URL, ASSETS_URL } from "./api/const";



export function getApiUrl(path?: string) {
  return new URL(path || "/", API_URL).toString()
}

export function getAssetsUrl(path?: string) {
  return new URL(path || "/", ASSETS_URL).toString()
}

export function getSiteUrl(path?: string) {
  return new URL(path || "/", ASSETS_URL).toString()
}
