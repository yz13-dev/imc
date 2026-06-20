
import RefContent from "@/app/(panel)/components/ref-content"
import { cn } from "@workspace/ui/lib/utils"
import { AnimatePresence } from "motion/react"
import Link from "next/link"

type CollectionCardProps = {
  scope?: string
  mimeType: string
  id: string
  src: string
  title: string
  className?: string
  blurhash?: string
  style?: React.CSSProperties
}

export default function CollectionCard({ mimeType, id, src, title, scope = "", className, blurhash, style = {} }: CollectionCardProps) {

  const href = scope ? `/${scope}/${id}` : `/${id}`
  return (
    <div className="group w-full break-inside-avoid">
      <AnimatePresence>
        <RefContent
          mimeType={mimeType}
          src={src}
          className={cn(
            "rounded-sm [&_img]:rounded-sm [&_video]:rounded-sm",
            "outline-4 outline-transparent group/-hover:outline-foreground/10 bg-foreground/10",
            "group-hover:scale-101 will-change-transform transition-all group-hover:p-1 p-0",
            className
          )}
          blurhash={blurhash}
          style={style}
        >
          <Link href={href} className="absolute inset-0 z-10" />
        </RefContent>
      </AnimatePresence>
      <div className="p-2 hidden">
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
    </div>
  )
}
