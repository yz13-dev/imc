"use client"
import CardGrid from "@/app/(panel)/components/card-grid"
import { useGlobalStore } from "@/lib/stores/global-store"
import type { Attachment } from "@/types/attachments"
import { useMemo } from "react"


type CollectionGridProps = {
  collection: string
  defaultAttachments?: Attachment[]
}

export default function CollectionGrid({ defaultAttachments = [], collection }: CollectionGridProps) {

  const collections = useGlobalStore(state => state.collectionsItems);

  const merhedAttachments = useMemo(() => {
    const unique = [...collections[collection] || [], ...defaultAttachments].filter((item, index, self) =>
      index === self.findIndex((t) => t.id === item.id)
    )
    return unique
  }, [collections, defaultAttachments, collection])


  const attachments = (merhedAttachments)
    // @ts-expect-error
    .toSorted((a, b) => {
      const aDate = new Date(a.created_at)
      const bDate = new Date(b.created_at)
      return bDate.getTime() - aDate.getTime()
    })

  return (
    <CardGrid
      attachments={attachments || []}
      scope="ref"
    />
  )
}
