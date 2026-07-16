export async function parseResponse<T>(response: Response): Promise<{ data: T | null, error: string | null }> {
  const text = await response.text()
  const json = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message = json && typeof json === "object" && "message" in json
      ? String((json as { message: unknown }).message)
      : response.statusText || `Request failed with status ${response.status}`
    return { data: null, error: message }
  }

  return { data: json as T, error: null }
}
