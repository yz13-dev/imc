"use server"

import { cookies } from "next/headers";
import { parseResponse } from "./parse-response";



type MakeFetchProps = {
  url: string
  body?: any
} & Omit<RequestInit, "body">
export async function makeFetch<T>({ url, headers, body, ...props }: MakeFetchProps): Promise<{ data: T | null, status: number, error: string | null }> {
  try {

    const getBody = (body: any) => {
      if (body === undefined) return undefined
      if (body instanceof FormData) {
        return body
      }
      return JSON.stringify(body)
    }

    const cookieStore = await cookies();

    const prepared = {
      ...headers,
      "Cookie": cookieStore.toString()
    };

    const response = await fetch(url, {
      ...props,
      body: getBody(body),
      headers: prepared,
      credentials: "include"
    })

    return await parseResponse<T>(response)

  } catch (error) {
    return { data: null, status: 500, error: error instanceof Error ? error.message : String(error) }
  }
}
