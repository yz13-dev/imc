import { parseResponse } from "./parse-response";

const getBody = (body: any) => {
  if (body === undefined) return undefined
  if (body instanceof FormData) {
    return body
  }
  return JSON.stringify(body)
}

type MakeFetchProps = {
  url: string
  body?: any
} & Omit<RequestInit, "body">
export async function makeClientFetch<T>({ url, headers, body, ...props }: MakeFetchProps): Promise<{ data: T | null, error: string | null }> {
  try {

    const response = await fetch(url, {
      ...props,
      body: getBody(body),
      headers,
      credentials: "include"
    })

    return await parseResponse<T>(response)

  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : String(error) }
  }
}
