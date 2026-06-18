import { getRefSrc } from "@/lib/ref-src"
import type { Attachment } from "@/types/attachments"
import CollectionCard from "../[user]/[collection]/components/collection-card"



type CardGridProps = {
  scope?: string
  attachments: Attachment[]
}

export default function CardGrid({ attachments, scope }: CardGridProps) {
  return (
    <div
      className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 space-y-4"
    >
      {
        attachments.map((item) => {
          const alt = getRefSrc(item.src)
          const title = item.label || alt || "-"
          return (
            <CollectionCard
              key={item.id}
              id={item.id}
              src={item.src}
              mimeType={item.mime_type}
              title={title}
              scope={scope}
              style={{
                aspectRatio: `${item.width}/${item.height}`
              }}
            />
          )
        })
      }
    </div>
  )
}
