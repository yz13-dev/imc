"use client"
import Video from "@/components/video"
import { toBlurDataURL } from "@/lib/blurhash"
import { assetImageLoader } from "@/lib/image-loader"
import { getAssetsProxyUrl } from "@/lib/url"
import { Reference, ReferenceContent, ReferenceOverlay } from "@workspace/ui/components/reference"
import Image from "next/image"

const HIDE_CONTENT = true;

type RefContentType = {
  id: string
  src: string
  blurhash?: string
  className?: string
  children?: React.ReactNode
  mimeType: string
  alt?: string
  style?: React.CSSProperties
  viewTransitionName?: string
  // Hint for next/image's srcset selection — without it, a `fill` image
  // defaults to 100vw and always fetches the largest device size, even when
  // rendered as a small grid thumbnail.
  sizes?: string
  quality?: number
}
export default function RefContent({ quality = 75, id, blurhash, src, className = "", children, mimeType, alt = "", style = {}, viewTransitionName, sizes = "100vw" }: RefContentType) {

  const isVideo = mimeType.startsWith("video/")
  const isGif = mimeType.startsWith("image/gif")

  const resolvedId = id // getRefSrc(src) || src;
  const refSrc = getAssetsProxyUrl(`/${resolvedId || src}`)
  const hasBlurhash = blurhash !== undefined || blurhash !== ""
  const mediaStyle: React.CSSProperties | undefined = viewTransitionName ? { viewTransitionName } : undefined

  return (
    <Reference
      className={className}
      style={style}
    >
      {children}
      <ReferenceContent>
        {
          HIDE_CONTENT &&
          isVideo &&
          <Video
            data-slot="reference-attachment"
            src={refSrc}
            draggable={false}
            loop
            muted
            autoPlay
            aria-label={alt}
            style={mediaStyle}
          />
        }
        {
          HIDE_CONTENT &&
          isGif &&
          <Image
            data-slot="reference-attachment"
            src={refSrc}
            draggable={false}
            unoptimized
            fill
            sizes={sizes}
            loading="lazy"
            placeholder={hasBlurhash && blurhash ? "blur" : "empty"}
            blurDataURL={hasBlurhash && blurhash ? toBlurDataURL(blurhash, mimeType) : undefined}
            alt={alt}
            style={mediaStyle}
            quality={quality}
          />
        }
        {
          HIDE_CONTENT &&
          !isVideo && !isGif &&
          <Image
            data-slot="reference-attachment"
            src={refSrc}
            loader={assetImageLoader}
            draggable={false}
            fill
            sizes={sizes}
            loading="lazy"
            placeholder={hasBlurhash && blurhash ? "blur" : "empty"}
            blurDataURL={hasBlurhash && blurhash ? toBlurDataURL(blurhash, mimeType) : undefined}
            alt={alt}

            style={mediaStyle}
            quality={quality}
          />
        }
        <ReferenceOverlay />
      </ReferenceContent>
    </Reference>
  )
}
