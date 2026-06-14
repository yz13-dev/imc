
import { cn } from "@workspace/ui/lib/utils"
import Image from "next/image"

type CollectionCardProps = {
  src: string
  title: string
}

export default function CollectionCard({ src, title }: CollectionCardProps) {

  const isVideo = src.endsWith(".mp4")
  const isGif = src.endsWith(".gif")

  return (
    <div className="group w-full break-inside-avoid">
      <figure
        className={cn(
          "w-full relative bg-muted transition-all",
          "rounded-2xl [&_img]:rounded-2xl [&_video]:rounded-2xl",
          "outline-2 outline-offset-2 outline-transparent group-hover:outline-foreground",
          "group-hover:scale-102 will-change-transform delay-200"
        )}
      >
        {
          isVideo &&
          <video src={src} className="block static!" muted autoPlay aria-label={title} />
        }
        {
          isGif &&
          <Image src={src} className="block static!" unoptimized fill alt={title} />
        }
        {
          !isVideo && !isGif &&
          <Image src={src} className="block static!" fill alt={title} />
        }
      </figure>
      <div className="pt-2 px-2">
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
    </div>
  )
}
