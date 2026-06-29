"use client"
import { OptionalVideoProvider } from "@/components/video-provider";
import { getAllAttachments } from "@/lib/api/attachments";
import { getRefSrc } from "@/lib/ref-src";
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments";
import type { InfiniteData } from "@tanstack/react-query";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import RefContent from "../ref-content";

export function AttachmentSkeleton() {
  return (
    <div className="rounded-sm aspect-video max-w-4xl [&_img]:rounded-sm [&_video]:rounded-sm" />
  );
}

export default function Attachment({ attachmentId }: { attachmentId: string }) {

  // const items = useGlobalStore(state => state.collectionsItems)
  // const inbox = useGlobalStore((state) => state.inbox)

  const { data } = useSuspenseInfiniteQuery<AttachmentWithMaybeTagsAndSource[], Error, InfiniteData<AttachmentWithMaybeTagsAndSource[], number>, string[], number>({
    getNextPageParam: (lastPageParam, allPages, offset) => {
      return offset + 25
    },
    initialPageParam: 0,
    queryKey: ["attachments"],
    queryFn: async ({ pageParam }) => {
      const data = await getAllAttachments({ offset: pageParam })
      return data || []
    }
  })

  // const attachments = useMemo(() => {
  //   const inboxAttachments = inbox.map((attachment) => attachment.attachment)
  //   return [...Object.values(items).flat(), ...inboxAttachments]
  // }, [items])

  const attachment = (data.pages.flat() || []).find((item) => item.id === attachmentId)

  if (!attachment) return null;

  const refSrc = getRefSrc(attachment.src)
  if (!refSrc) return null;
  const title = attachment.label || refSrc || "-"


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
            className="rounded-sm z-50 [&_img]:rounded-sm [&_video]:rounded-sm"
            style={{
              aspectRatio: `${attachment.width}/${attachment.height}`
            }}
          />
        }
      </div>
    </OptionalVideoProvider>
  )
}
