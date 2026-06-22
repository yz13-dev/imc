
import RefContent from "@/app/(panel)/components/ref-content"
import { formatDuration } from "@/lib/format-duration"
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { ArrowUpRightIcon, GlobeIcon } from "lucide-react"
import { AnimatePresence } from "motion/react"
import Link from "next/link"

type CollectionCardProps = {
  scope?: string
  className?: string
  style?: React.CSSProperties
} & AttachmentWithMaybeTagsAndSource

export default function CollectionCard({ mime_type, id, src, scope = "", className, blurhash, duration_ms, style = {}, label, source }: CollectionCardProps) {

  const href = scope ? `/${scope}/${id}` : `/${id}`

  const duration = duration_ms ? formatDuration(duration_ms) : null

  return (
    <div className="group w-full break-inside-avoid">
      <AnimatePresence>
        <RefContent
          id={id}
          mimeType={mime_type}
          src={src}
          className={cn(
            "rounded-sm [&_img]:rounded-sm [&_video]:rounded-sm",
            "outline-4 outline-transparent group/-hover:outline-foreground/10 bg-foreground/10",
            "group-hover:scale/-101 will-change-transform transition-all group-hover:p-/1 p-/0",
            className
          )}
          blurhash={blurhash}
          style={style}
        >
          <Link href={`?attachment=${id}`} className="absolute inset-0 z-10" />
          {
            source &&
            <div className="absolute bottom-2 left-0 px-2 z-10 w-full flex items-center justify-between gap-1">
              <div className="flex items-center gap-1">
                <Avatar className="size-5 rounded-full overflow-clip *:rounded-full after:rounded-full">
                  <AvatarImage src={source.domain.favicon_url || undefined} />
                  <AvatarFallback>
                    <GlobeIcon />
                  </AvatarFallback>
                </Avatar>
                <Badge variant="outline" className="bg-foreground/50 border-foreground/50 backdrop-blur-md text-background">
                  {source.domain.domain}
                </Badge>
              </div>
              <Button size="icon-xs" className="bg-foreground/50 border-foreground/50 text-background backdrop-blur-md" nativeButton={false} render={<Link href={href} />}>
                <ArrowUpRightIcon />
              </Button>
            </div>
          }
          {
            duration &&
            <Badge className="absolute bottom-2 right-2 z-10">
              {duration}
            </Badge>
          }
        </RefContent>
      </AnimatePresence>
      <div className="p-2 hidden">
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}
