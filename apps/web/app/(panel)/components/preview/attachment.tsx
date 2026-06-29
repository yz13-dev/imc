"use client"
import { OptionalVideoProvider } from "@/components/video-provider";
import { getAttachment } from "@/lib/api/attachments";
import { getRefSrc } from "@/lib/ref-src";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import RefContent from "../ref-content";

export function AttachmentSkeleton() {
  return (
    <div className="rounded-sm aspect-video max-w-4xl [&_img]:rounded-sm [&_video]:rounded-sm" />
  );
}

export default function Attachment({ attachmentId }: { attachmentId: string }) {

  // const items = useGlobalStore(state => state.collectionsItems)
  // const inbox = useGlobalStore((state) => state.inbox)
  //

  const { data, isLoading, isPending } = useSuspenseQuery({
    queryKey: ["attachments", "ref", attachmentId],
    queryFn: () => getAttachment(attachmentId).then(data => data)
  })

  const attachment = data

  if (!attachment) return null;

  const refSrc = getRefSrc(attachment.src)
  if (!refSrc) return null;
  const title = attachment.label || refSrc || "-"

  const tags = attachment.tags.flatMap(item => item.tag) || []

  return (
    <OptionalVideoProvider duration={attachment.duration_ms}>
      <div className="max-w-4xl w-full h-full overflow-y-auto">
        {
          attachment &&
          <RefContent
            id={attachment.id}
            src={refSrc}
            mimeType={attachment.mime_type}
            blurhash={attachment.blurhash}
            alt={title}
            className="rounded-sm max-h-full z-50 [&_img]:rounded-sm [&_video]:rounded-sm"
            style={{
              aspectRatio: `${attachment.width}/${attachment.height}`
            }}
          />
        }
      </div>
      <div className="max-w-4xl w-full flex items-center pt-6 justify-center gap-1">
        {
          tags.map(tag => {
            return <Badge key={tag.id} variant="secondary" className="text-base py-1 uppercase h-fit">{tag.name}</Badge>
          })
        }
      </div>
    </OptionalVideoProvider>
  )
}
