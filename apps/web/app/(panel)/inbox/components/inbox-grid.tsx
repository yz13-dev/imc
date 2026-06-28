"use client"
import { CollectionCardSkeleton } from "@/components/collection-card"
import { getInboxAttachments } from "@/lib/api/attachments"
import type { InboxItem } from "@/types/inbox"
import { useSuspenseQuery } from "@tanstack/react-query"
import CardGrid from "../../components/card-grid"
import CardGridWrapper from "../../components/card-grid-wrapper"


type InboxGridProps = {
  defaultInbox?: InboxItem[]
}

export default function InboxGrid({ defaultInbox = [] }: InboxGridProps) {

  const { data, isLoading } = useSuspenseQuery({ queryKey: ["inbox"], queryFn: getInboxAttachments })
  const attachments = (data || []).map(item => item.attachment) // useInboxAttachments({ inbox: defaultInbox })

  if (isLoading) {
    return (
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
  }
  return (
    <CardGrid
      attachments={attachments || []}
      scope="ref"
      withPreview
    />
  )
}
