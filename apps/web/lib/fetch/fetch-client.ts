import { parseResponse } from "./parse-response";

type MakeFetchProps = {
  url: string
  body?: any
} & Omit<RequestInit, "body">
export async function makeClientFetch<T>({ url, headers, body, ...props }: MakeFetchProps): Promise<{ data: T | null, error: string | null }> {
  try {

    const response = await fetch(url, {
      ...props,
      body: body ? JSON.stringify(body) : undefined,
      headers,
      credentials: "include"
    })

    return await parseResponse<T>(response)

  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : String(error) }
  }
}
