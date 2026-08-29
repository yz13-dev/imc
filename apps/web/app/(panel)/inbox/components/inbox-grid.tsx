"use client"
import { CollectionCardSkeleton } from "@/components/collection-card"
import { useDebounce } from "@/hooks/use-debounce"
import { getInboxAttachments } from "@/lib/api/attachments"
import type { InfiniteData, QueryKey } from "@tanstack/react-query"
import { useSuspenseInfiniteQuery } from "@tanstack/react-query"
import { useInView } from "motion/react"
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs"
import { useEffect, useRef, useState } from "react"
import CardGrid from "../../components/card-grid"
import CardGridWrapper from "../../components/card-grid-wrapper"

export function InboxGridSkeleton() {
  return <CardGridWrapper>{[...Array(24)].map((_, i) => <CollectionCardSkeleton key={i} className="aspect-square" />)}</CardGridWrapper>
}

export default function InboxGrid() {
  const [tagQuery] = useQueryState("tags", parseAsArrayOf(parseAsString))
  const tags = tagQuery ?? []
  const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery({
    initialPageParam: null as string | null,
    queryKey: ["attachments", "inbox", tags],
    queryFn: async ({ pageParam }) => {
      const page = await getInboxAttachments({ cursor: pageParam, limit: 25, tags })
      return {
        items: (page?.items || []).map(item => item.attachment),
        next_cursor: page?.next_cursor || "",
      }
    },
    getNextPageParam: (lastPage) => lastPage.next_cursor || undefined,
  })
  const attachments = data.pages.flatMap(page => page.items)
  const ref = useRef(null)
  const inView = useInView(ref, { margin: "0px 0px 100% 0px" })
  const [disabled, setDisabled] = useState(true)
  const debouncedInView = useDebounce(inView, 25)
  useEffect(() => { if (attachments.length) setDisabled(false) }, [attachments.length])
  useEffect(() => {
    if (!disabled && debouncedInView && hasNextPage) void fetchNextPage()
  }, [debouncedInView, disabled, fetchNextPage, hasNextPage])

  return <>
    <CardGrid attachments={attachments} visibility="private" />
    <div ref={ref} className="w-full py-6" />
  </>
}
