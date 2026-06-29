import { formatDuration } from "@/lib/format-duration"
import { useVideoStore } from "@/lib/stores/video-store"
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { ArrowUpRightIcon, GlobeIcon, TagsIcon } from "lucide-react"
import Link from "next/link"



type CardFooterProps = {
  href: string
  duration_ms: AttachmentWithMaybeTagsAndSource["duration_ms"]
  source: AttachmentWithMaybeTagsAndSource["source"]
  tags: AttachmentWithMaybeTagsAndSource["tags"]
  label: AttachmentWithMaybeTagsAndSource["label"]
}
export default function CardFooter({ source, duration_ms, label, tags = [], href }: CardFooterProps) {

  const firstTag = tags[0]?.tag?.name ?? ""
  // const isVideo = mime_type.startsWith("video/")
  //
  const position = useVideoStore(state => state.position)

  const duration = duration_ms ? formatDuration(duration_ms - Math.floor(position * 1000)) : null

  return (
    <div className="absolute bottom-2 left-0 px-2 z-10 w-full flex items-center justify-between *:w-1/2 gap-1">
      <div className="flex items-center gap-1">
        {
          source &&
          <div className="flex items-center justify-start gap-1">
            <Avatar className="size-5 rounded-full overflow-clip *:rounded-full after:rounded-full">
              <AvatarImage src={source.domain.favicon_url || undefined} />
              <AvatarFallback>
                <GlobeIcon />
              </AvatarFallback>
            </Avatar>
          </div>
        }
        {
          !!label.length &&
          <Badge className="h-6 bg-foreground/50 tabular-nums border-foreground/50 text-background max-w-full line-clamp-1! backdrop-blur-3xl">
            {label}
          </Badge>
        }
      </div>
      <div className="flex items-center justify-end gap-1">
        {
          !!duration &&
          <Badge className="h-6 bg-foreground/50 tabular-nums border-foreground/50 text-background backdrop-blur-3xl">
            {duration}
          </Badge>
        }
        {
          tags.length > 0 &&
          <Badge className="h-6 bg-foreground/50 tabular-nums border-foreground/50 text-background backdrop-blur-3xl">
            <TagsIcon />
            <span>{firstTag}{tags.length > 1 && ` +${tags.length - 1}`}</span>
          </Badge>
        }
        <Button
          size="icon-xs"
          className="bg-foreground/50 border-foreground/50 text-background backdrop-blur-md"
          nativeButton={false}
          render={<Link href={href} />}
        >
          <ArrowUpRightIcon />
        </Button>
      </div>
    </div>
  )
}
