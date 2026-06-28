import type { CollectionCardProps } from "@/components/collection-card";
import CollectionCard from "@/components/collection-card";
import { getRefSrc } from "@/lib/ref-src";
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments";
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
            return (
              <CollectionCard
                key={item.id}
                {...item}
                {...(card ?? {})}
                label={label}
                scope={scope}
                preview={withPreview}
                style={{
                  aspectRatio: `${item.width}/${item.height}`
                }}
              />
            )
          })
      }
    </CardGridWrapper>
  )
}
