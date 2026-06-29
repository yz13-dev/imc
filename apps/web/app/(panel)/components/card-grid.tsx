import type { CollectionCardProps } from "@/components/collection-card";
import CollectionCard from "@/components/collection-card";
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments";
import CardGridWrapper from "./card-grid-wrapper";


type CardGridProps = {
  scope?: string
  attachments: AttachmentWithMaybeTagsAndSource[]
  withPreview?: boolean
  className?: string
  card?: Partial<CollectionCardProps>
  readonly?: boolean
}

export default function CardGrid({ readonly = false, card, attachments, scope, withPreview = false, className = "" }: CardGridProps) {
  return (
    <CardGridWrapper className={className}>
      {
        attachments
          .map((item) => {
            // const alt = getRefSrc(item.src)
            return (
              <CollectionCard
                key={item.id}
                {...item}
                {...(card ?? {})}
                scope={scope}
                preview={withPreview}
                readonly={readonly}
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
