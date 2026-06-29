"use client"
import Video from "@/components/video"
import { toBlurDataURL } from "@/lib/blurhash"
import { getRefSrc } from "@/lib/ref-src"
import { getAssetsUrl } from "@/lib/url"
import { cn } from "@workspace/ui/lib/utils"
import { cubicBezier, motion } from "motion/react"
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

  const resolvedId = getRefSrc(src) || src;
  const refSrc = getAssetsUrl(`/v1/attachments/${resolvedId || src}/file`)
  const hasBlurhash = blurhash !== undefined || blurhash !== ""

  return (
    <motion.figure
      layout
      layoutRoot
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
        className={cn(
          "size-full will-change-auto relative bg-muted overflow-hidden bg-no-repeat bg-cover bg-top-left",
          "rounded-lg [&_img]:rounded-sm [&_video]:rounded-sm",
        )}
        onClick={() => setId(id)}
        transition={{
          duration: .15,
          ease: cubicBezier(.56, .17, .05, .85)
        }}
      // style={{
      //   backgroundImage: blurhash ? `url(${toBlurDataURL(blurhash)})` : undefined
      // }}
      >
        {
          HIDE_CONTENT &&
          isVideo &&
          <Video
            src={refSrc}
            draggable={false}
            className="size-full object-cover object-top-left"
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
            src={refSrc}
            draggable={false}
            className="size-full object-cover object-top-left"
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
            src={refSrc}
            draggable={false}
            className="size-full object-cover object-top-left"
            unoptimized
            fill
            loading="lazy"
            placeholder={hasBlurhash && blurhash ? "blur" : "empty"}
            blurDataURL={hasBlurhash && blurhash ? toBlurDataURL(blurhash, mimeType) : undefined}
            alt={alt}
          />
        }
        <div className="absolute inset-0" data-id={id} />
      </motion.div>
    </motion.figure>
  )
}
