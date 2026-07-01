"use client"
import Video from "@/components/video"
import { toBlurDataURL } from "@/lib/blurhash"
import { getAssetsUrl } from "@/lib/url"
import { Reference, ReferenceContent, ReferenceOverlay } from "@workspace/ui/components/reference"
import Image from "next/image"
import { useQueryState } from "nuqs"

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
}
export default function RefContent({ id, blurhash, src, className = "", children, mimeType, alt = "", style = {} }: RefContentType) {

  const [_, setId] = useQueryState("attachment")
  const isVideo = mimeType.startsWith("video/")
  const isGif = mimeType.startsWith("image/gif")

  const resolvedId = id // getRefSrc(src) || src;
  const refSrc = getAssetsUrl(`/v1/attachments/${resolvedId || src}/file`)
  const hasBlurhash = blurhash !== undefined || blurhash !== ""

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
            loading="lazy"
            placeholder={hasBlurhash && blurhash ? "blur" : "empty"}
            blurDataURL={hasBlurhash && blurhash ? toBlurDataURL(blurhash, mimeType) : undefined}
            alt={alt}
          />
        }
        {
          HIDE_CONTENT &&
          !isVideo && !isGif &&
          <Image
            data-slot="reference-attachment"
            src={refSrc}
            draggable={false}
            unoptimized
            fill
            loading="lazy"
            placeholder={hasBlurhash && blurhash ? "blur" : "empty"}
            blurDataURL={hasBlurhash && blurhash ? toBlurDataURL(blurhash, mimeType) : undefined}
            alt={alt}
          />
        }
        <ReferenceOverlay />
      </ReferenceContent>
    </Reference>
  )
}
