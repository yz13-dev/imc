"use client"
import { OptionalVideoProvider } from "@/components/video-provider";
import { getAttachment } from "@/lib/api/attachments";
import { getRefSrc } from "@/lib/ref-src";
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import { ReferenceBadge, ReferenceButton } from "@workspace/ui/components/reference";
import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import RefContent from "../ref-content";

export function AttachmentSkeleton() {
  return (
    <div className="rounded-sm aspect-video max-w-4xl [&_img]:rounded-sm [&_video]:rounded-sm" />
  );
}

function AttachmentContent({ attachmentId, id, src, mime_type, blurhash, label, width, height }: { attachmentId: string | null } & AttachmentWithMaybeTagsAndSource) {
  return (
    <RefContent
      quality={100}
      id={id}
      src={src}
      mimeType={mime_type}
      blurhash={blurhash}
      alt={label}
      className="rounded-sm max-h-full z-50 [&_img]:rounded-sm [&_video]:rounded-sm"
      style={{
        aspectRatio: `${width}/${height}`
      }}
      viewTransitionName={attachmentId ? `attachment-${id}` : undefined}
      // Matches the wrapping div's max-w-4xl (896px).
      sizes="100vw"
    />
  )
}

export default function Attachment() {

  const [attachmentId] = useQueryState("attachment", parseAsString)

  const { data } = useQuery({
    queryKey: ["attachments", "ref", attachmentId],
    queryFn: () => getAttachment(attachmentId!),
    enabled: !!attachmentId
  })

  const attachment = data
  const tags = (attachment?.tags || []).flatMap(item => item.tag) || []

  return (
    <OptionalVideoProvider duration={attachment?.duration_ms || 0}>
      <div className="max-w-4xl w-full h-full overflow-y-auto">
        <div className="w-full h-fit">
          {
            attachment &&
            <AttachmentContent
              {...data}
              attachmentId={attachmentId}
              src={getRefSrc(attachment.src) || attachment.src}
            />
          }
        </div>
      </div>
      <div className="w-full flex lg:flex-row flex-col lg:items-center lg:justify-between gap-6 pt-6 px-6">
        <div className="lg:w-1/2 w-full flex items-center gap-1">
          <ReferenceBadge className="text-sm">{attachment?.label || attachment?.id}</ReferenceBadge>
          <ReferenceButton
            onClick={e => e.stopPropagation()}
            nativeButton={false}
            render={<Link href={`/ref/${attachment?.id}`} />}
          >
            <ArrowUpRightIcon />
          </ReferenceButton>
        </div>
        <div className="lg:w-1/2 w-full flex items-center lg:justify-end justify-start gap-1">
          {
            tags.map(tag => {
              return <Badge key={tag.id} variant="secondary" className="text-base py-1 uppercase h-fit">{tag.name}</Badge>
            })
          }
        </div>
      </div>
    </OptionalVideoProvider>
  )
}
