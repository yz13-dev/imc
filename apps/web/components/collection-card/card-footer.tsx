import { formatDuration } from "@/lib/format-duration"
import { useVideoStore } from "@/lib/stores/video-store"
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { ReferenceBadge, ReferenceButton, ReferenceFooter, ReferenceFooterGroup, ReferenceLabel } from "@workspace/ui/components/reference"
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
    <ReferenceFooter>
      <ReferenceFooterGroup>
        {
          source &&
          <Avatar className="size-5 rounded-full overflow-clip *:rounded-full after:rounded-full">
            <AvatarImage src={source.domain.favicon_url || undefined} />
            <AvatarFallback>
              <GlobeIcon />
            </AvatarFallback>
          </Avatar>
        }
        {
          !!label.length &&
          <ReferenceLabel>
            {label}
          </ReferenceLabel>
        }
      </ReferenceFooterGroup>
      <ReferenceFooterGroup>
        {
          !!duration &&
          <ReferenceBadge>
            {duration}
          </ReferenceBadge>
        }
        {
          tags.length > 0 &&
          <ReferenceBadge>
            <TagsIcon />
            <span>{firstTag}{tags.length > 1 && ` +${tags.length - 1}`}</span>
          </ReferenceBadge>
        }
        <ReferenceButton
          nativeButton={false}
          render={<Link href={href} />}
        >
          <ArrowUpRightIcon />
        </ReferenceButton>
      </ReferenceFooterGroup>
    </ReferenceFooter>
  )
}
