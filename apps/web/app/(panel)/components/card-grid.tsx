import { OptionalVideoProvider } from "@/components/video-provider";
import { getRefSrc } from "@/lib/ref-src";
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments";
import CollectionCard from "../[user]/[collection]/components/collection-card";


type CardGridProps = {
  scope?: string
  attachments: AttachmentWithMaybeTagsAndSource[]
  withPreview?: boolean
}

export default function CardGrid({ attachments, scope, withPreview = false }: CardGridProps) {
  return (
    <div className="@container">
      <div
        className="@7xl:columns-6 @6xl:columns-5 @5xl:columns-5 @4xl:columns-4 @xl:columns-3 @lg:columns-2 @sm:columns-1 space-y-2 gap-x-2"
      >
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
      </div>
    </div>
  )
}
