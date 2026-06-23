"use client"
import { toBlurDataURL } from "@/lib/blurhash"
import { getRefSrc } from "@/lib/ref-src"
import { getApiUrl } from "@/lib/url"
import { cn } from "@workspace/ui/lib/utils"
import { cubicBezier, motion } from "motion/react"
import Image from "next/image"
import { useQueryState } from "nuqs"


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

  const resolvedId = getRefSrc(src) || src;
  const refSrc = getApiUrl(`/v1/my/attachments/${resolvedId || src}/file`)
  const hasBlurhash = blurhash !== undefined || blurhash !== ""

  return (
    <motion.figure
      layout
      layoutCrossfade={false}
      className={cn(
        "w-full relative",
        className
      )}
      style={style}
      transition={{
        duration: .15,
        ease: cubicBezier(.56, .17, .05, .85)
      }}
    >
      {children}
      <motion.div
        layoutId={id}
        className="size-full will-change-auto relative bg-muted"
        onClick={() => setId(id)}
        transition={{
          duration: .15,
          ease: cubicBezier(.56, .17, .05, .85)
        }}
      >
        {
          isVideo &&
          <video
            src={refSrc}
            draggable={false}
            className="size-full"
            muted
            autoPlay
            aria-label={alt}
          />
        }
        {
          isGif &&
          <Image
            src={refSrc}
            draggable={false}
            className="size-full object-cover"
            unoptimized
            fill
            loading="lazy"
            placeholder={hasBlurhash && blurhash ? "blur" : "empty"}
            blurDataURL={hasBlurhash && blurhash ? toBlurDataURL(blurhash, mimeType) : undefined}
            alt={alt}
          />
        }
        {
          !isVideo && !isGif &&
          <Image
            src={refSrc}
            draggable={false}
            className="size-full object-cover"
            unoptimized
            fill
            loading="lazy"
            placeholder={hasBlurhash && blurhash ? "blur" : "empty"}
            blurDataURL={hasBlurhash && blurhash ? toBlurDataURL(blurhash, mimeType) : undefined}
            alt={alt}
          />
        }
      </motion.div>
    </motion.figure>
  )
}
