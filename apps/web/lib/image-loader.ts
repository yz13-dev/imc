import type { ImageLoaderProps } from "next/image"

// Assets require cookie auth, which next/image's own optimizer can't forward
// when it fetches the upstream image server-side. Resizing/format conversion
// already happens in the Go API via imgproxy, so this loader points the
// browser straight at that endpoint and lets it fetch with the user's cookies.
export function assetImageLoader({ src, width, quality }: ImageLoaderProps): string {
  const url = new URL(src)
  url.searchParams.set("w", String(width))
  if (quality) url.searchParams.set("q", String(quality))
  console.log("[LOADER]", url.toString())
  return url.toString()
}
