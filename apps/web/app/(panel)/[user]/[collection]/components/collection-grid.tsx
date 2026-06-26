"use client"
import CardGrid from "@/app/(panel)/components/card-grid"
import CardGridWrapper from "@/app/(panel)/components/card-grid-wrapper"
import { getCollectionAttachments } from "@/lib/api/attachments"
import type { Attachment } from "@/types/attachments"
import { useSuspenseQuery } from "@tanstack/react-query"
import { CollectionCardSkeleton } from "./collection-card"


type CollectionGridProps = {
  collection: string
  defaultAttachments?: Attachment[]
}

export default function CollectionGrid({ defaultAttachments = [], collection }: CollectionGridProps) {

  // const attachments = useCollectionAttachments({ collection, attachments: defaultAttachments })

  const { data, isLoading } = useSuspenseQuery({
    queryKey: ["collections", collection],
    queryFn: () => {
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
    />
  )
}
