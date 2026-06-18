import { getRefSrc } from "@/lib/ref-src"
import { getApiUrl } from "@/lib/url"
import { cn } from "@workspace/ui/lib/utils"
import Image from "next/image"


type RefContentType = {
  src: string
  className?: string
  children?: React.ReactNode
  mimeType: string
  alt?: string
  style?: React.CSSProperties
}
export default function RefContent({ src, className = "", children, mimeType, alt = "", style = {} }: RefContentType) {

  const isVideo = mimeType.startsWith("video/")
  const isGif = mimeType.startsWith("image/gif")


  const resolvedId = getRefSrc(src) || src;
  const refSrc = getApiUrl(`/v1/my/attachments/${resolvedId || src}/file`)
  return (
    <figure
      className={cn(
        "w-full relative",
        className
      )}
      style={style}
    >
      {children}
      {
        isVideo &&
        <video src={refSrc} className="block static!" muted autoPlay aria-label={alt} />
      }
      {
        isGif &&
        <Image src={refSrc} className="block static!" unoptimized fill alt={alt} />
      }
      {
        !isVideo && !isGif &&
        <Image src={refSrc} className="block static!" unoptimized fill alt={alt} />
      }
    </figure>
  )
}
