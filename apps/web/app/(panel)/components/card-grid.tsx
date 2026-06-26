import { OptionalVideoProvider } from "@/components/video-provider";
import { getRefSrc } from "@/lib/ref-src";
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments";
import type { CollectionCardProps } from "../[user]/[collection]/components/collection-card";
import CollectionCard from "../[user]/[collection]/components/collection-card";
import CardGridWrapper from "./card-grid-wrapper";


type CardGridProps = {
  scope?: string
  attachments: AttachmentWithMaybeTagsAndSource[]
  withPreview?: boolean
  className?: string
  card?: Partial<CollectionCardProps>
}

export default function CardGrid({ card, attachments, scope, withPreview = false, className = "" }: CardGridProps) {
  return (
    <CardGridWrapper className={className}>
      {
        attachments
          .map((item) => {
            const alt = getRefSrc(item.src)
            const label = item.label || alt || "-"
            const isVideo = item.mime_type?.startsWith("video/")
            return (
              <OptionalVideoProvider key={item.id} isVideo={isVideo} duration={item.duration_ms}>
                <CollectionCard
                  {...item}
                  {...(card ?? {})}
                  label={label}
                  scope={scope}
                  preview={withPreview}
                  style={{
                    aspectRatio: `${item.width}/${item.height}`
                  }}
                />
              </OptionalVideoProvider>
            )
          })
      }
    </CardGridWrapper>
  )
}
