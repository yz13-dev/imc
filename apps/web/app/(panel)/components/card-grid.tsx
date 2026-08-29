import type { CollectionCardProps } from "@/components/collection-card";
import CollectionCard from "@/components/collection-card";
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments";
import CardGridWrapper from "./card-grid-wrapper";


type CardGridProps = {
  visibility?: "private" | "public"
  inTrash?: boolean
  attachments: AttachmentWithMaybeTagsAndSource[]
  className?: string
  card?: Partial<CollectionCardProps>
  readonly?: boolean
  collectionSelector?: boolean
  selectable?: boolean
}

export default function CardGrid({ readonly = false, card, attachments, visibility, inTrash = false, className = "", collectionSelector = false, selectable = false }: CardGridProps) {
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
                visibility={visibility}
                inTrash={inTrash}
                readonly={readonly}
                collectionSelector={collectionSelector}
                selectable={selectable}
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
