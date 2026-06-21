import { getAttachment } from "@/lib/api/attachments";
import { getRefSrc } from "@/lib/ref-src";
import RefContent from "../ref-content";

export function AttachmentSkeleton() {
  return (
    <div className="rounded-sm aspect-video max-w-4xl [&_img]:rounded-sm [&_video]:rounded-sm" />
  );
}

export default async function Attachment({ attachmentId }: { attachmentId: string }) {

  const attachment = await getAttachment(attachmentId)
  if (!attachment) return null;

  const refSrc = getRefSrc(attachment.src)
  if (!refSrc) return null;
  const title = attachment.label || refSrc || "-"


  return (
    <div className="max-w-4xl w-full h-full overflow-y-auto">
      <RefContent
        src={refSrc}
        mimeType={attachment.mime_type}
        blurhash={attachment.blurhash}
        alt={title}
        className="rounded-sm [&_img]:rounded-sm [&_video]:rounded-sm"
        style={{
          aspectRatio: `${attachment.width}/${attachment.height}`
        }}
      />
    </div>
  )
}
