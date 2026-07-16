"use server"

import { cookies } from "next/headers";
import { parseResponse } from "./parse-response";

type MakeFetchProps = {
  url: string
  body?: any
} & Omit<RequestInit, "body">
export async function makeFetch<T>({ url, headers, body, ...props }: MakeFetchProps): Promise<{ data: T | null, error: string | null }> {
  try {

    const cookieStore = await cookies();

    const prepared = {
      ...headers,
      "Cookie": cookieStore.toString()
    };

    const response = await fetch(url, {
      ...props,
      body: body ? JSON.stringify(body) : undefined,
      headers: prepared,
      credentials: "include"
    })

    return await parseResponse<T>(response)

  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : String(error) }
  }
}
