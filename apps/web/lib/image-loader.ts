import { getImageProps, type ImageLoaderProps } from "next/image"

// Assets require cookie auth, which next/image's own optimizer can't forward
// when it fetches the upstream image server-side. Resizing/format conversion
// already happens in the Go API via imgproxy, so this loader points the
// browser straight at that endpoint and lets it fetch with the user's cookies.
export function assetImageLoader({ src, width, quality }: ImageLoaderProps): string {
  const url = new URL(src)
  url.searchParams.set("w", String(width))
  if (quality) url.searchParams.set("q", String(quality))
  return url.toString()
}

// Resolves the exact URL next/image would put on the <img> tag for the given
// src/quality/sizes, so a manual preload (e.g. ahead of a view transition)
// warms the same HTTP cache entry the real <Image> is about to request,
// instead of a differently-sized/qualified variant.
export function resolveAssetImageUrl(src: string, quality: number, sizes = "100vw") {
  const { props } = getImageProps({
    src,
    loader: assetImageLoader,
    fill: true,
    sizes,
    quality,
    alt: "",
  })
  return props.src
}
