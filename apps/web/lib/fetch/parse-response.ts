export async function parseResponse<T>(response: Response): Promise<{ data: T | null, error: string | null }> {
  const text = await response.text()

  // The Go API returns plain-text bodies (http.Error) for most error
  // responses, not JSON -- only attempt JSON.parse when it looks like JSON,
  // otherwise treat the raw text itself as the message.
  let json: unknown = null
  if (text) {
    const trimmed = text.trim()
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        json = JSON.parse(trimmed)
      } catch {
        json = null
      }
    }
  }

  if (!response.ok) {
    const message = json && typeof json === "object" && "message" in json
      ? String((json as { message: unknown }).message)
      : text || response.statusText || `Request failed with status ${response.status}`
    return { data: null, error: message }
  }

  return { data: json as T, error: null }
}
