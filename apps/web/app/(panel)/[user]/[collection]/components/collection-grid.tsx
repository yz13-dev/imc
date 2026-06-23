"use client"
import CardGrid from "@/app/(panel)/components/card-grid"
import { useCollectionAttachments } from "@/hooks/useCollectionAttachments"
import type { Attachment } from "@/types/attachments"


type CollectionGridProps = {
  collection: string
  defaultAttachments?: Attachment[]
}

export default function CollectionGrid({ defaultAttachments = [], collection }: CollectionGridProps) {

  const attachments = useCollectionAttachments({ collection, attachments: defaultAttachments })

  return (
    <CardGrid
      attachments={attachments || []}
      scope="ref"
    />
  )
}
