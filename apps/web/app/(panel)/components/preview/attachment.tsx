"use client"
import { getRefSrc } from "@/lib/ref-src";
import { useGlobalStore } from "@/lib/stores/global-store";
import { useMemo } from "react";
import RefContent from "../ref-content";

export function AttachmentSkeleton() {
  return (
    <div className="rounded-sm aspect-video max-w-4xl [&_img]:rounded-sm [&_video]:rounded-sm" />
  );
}

export default function Attachment({ attachmentId }: { attachmentId: string }) {

  const items = useGlobalStore(state => state.collectionsItems)
  const inbox = useGlobalStore((state) => state.inbox)

  const attachments = useMemo(() => {
    const inboxAttachments = inbox.map((attachment) => attachment.attachment)
    return [...Object.values(items).flat(), ...inboxAttachments]
  }, [items])

  const attachment = attachments.find((item) => item.id === attachmentId)

  if (!attachment) return null;

  const refSrc = getRefSrc(attachment.src)
  if (!refSrc) return null;
  const title = attachment.label || refSrc || "-"


  return (
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
  )
}
