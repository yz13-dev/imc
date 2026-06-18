import { API_URL } from "./api/const";



export function getApiUrl(path: string) {
  return new URL(path, API_URL).toString()
}
