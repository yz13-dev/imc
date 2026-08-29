"use client"
import { CollectionCardSkeleton } from "@/components/collection-card"
import { getInboxAttachments } from "@/lib/api/attachments"
import { useSuspenseQuery } from "@tanstack/react-query"
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs"
import CardGrid from "../../components/card-grid"
import CardGridWrapper from "../../components/card-grid-wrapper"

export function InboxGridSkeleton() {
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

export default function InboxGrid() {

  const [tagQuery] = useQueryState("tags", parseAsArrayOf(parseAsString))
  const tags = tagQuery ?? []

  const { data, isLoading, isPending } = useSuspenseQuery({
    queryKey: ["attachments", "inbox", tags],
    queryFn: () => getInboxAttachments(tags)
  })
  const attachments = (data || []).map(item => item.attachment)

  if (isLoading || isPending) return <InboxGridSkeleton />
  return (
    <CardGrid
      attachments={attachments || []}
      visibility="private"
    />
  )
}
