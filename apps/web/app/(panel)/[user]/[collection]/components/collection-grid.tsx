"use client"
import CardGrid from "@/app/(panel)/components/card-grid"
import CardGridWrapper from "@/app/(panel)/components/card-grid-wrapper"
import { CollectionCardSkeleton } from "@/components/collection-card"
import { getCollectionAttachments } from "@/lib/api/attachments"
import type { Attachment, AttachmentWithTags } from "@/types/attachments"
import { useSuspenseQuery } from "@tanstack/react-query"


type CollectionGridProps<T> = {
  collection: string
  defaultAttachments?: Attachment[]
  readonly?: boolean
  queryKey?: string[]
  queryFn?: Promise<T>

}

export default function CollectionGrid<T extends AttachmentWithTags[] | null>({ defaultAttachments = [], collection, readonly = false, queryFn, queryKey }: CollectionGridProps<T>) {

  // const attachments = useCollectionAttachments({ collection, attachments: defaultAttachments })

  const { data, isLoading } = useSuspenseQuery({
    queryKey: queryKey || ["attachments", "collections", collection],
    queryFn: () => {
      if (queryFn) {
        const data = queryFn;
        return data;
      }
      const data = getCollectionAttachments(collection)
      return data
    }
  })

  const attachments = (data || []).toSorted((a, b) => {
    const aDate = new Date(a.created_at)
    const bDate = new Date(b.created_at)
    return bDate.getTime() - aDate.getTime()
  })

  if (isLoading) return (
    <CardGridWrapper>
      {
        [...Array(24)].map((_, i) => {
          const everyFourth = i % 4 === 0
          const everySecond = i % 2 === 0
          const everyThird = i % 3 === 0
          return <CollectionCardSkeleton key={i} className={everyFourth ? "aspect-square" : everyThird ? "aspect-9/16" : everySecond ? "aspect-video" : "aspect-square"} />
        })
      }
    </CardGridWrapper>
  )
  return (
    <CardGrid
      attachments={attachments}
      scope="ref"
      readonly={readonly}
    />
  )
}
