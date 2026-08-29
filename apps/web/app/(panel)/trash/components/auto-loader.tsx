"use client"
import { getTrashAttachments } from "@/lib/api/attachments"
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments"
import type { InfiniteData, QueryKey } from "@tanstack/react-query"
import { useSuspenseInfiniteQuery } from "@tanstack/react-query"
import { useInView } from "motion/react"
import { useEffect, useRef, useState } from "react"
import CardGrid from "../../components/card-grid"

export default function TrashAutoLoader() {
  const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery<AttachmentWithMaybeTagsAndSource[], Error, InfiniteData<AttachmentWithMaybeTagsAndSource[], number>, QueryKey, number>({
    initialPageParam: 0,
    queryKey: ["attachments", "trash"],
    queryFn: async ({ pageParam }) => await getTrashAttachments({ offset: pageParam, limit: 25 }) || [],
    getNextPageParam: (lastPage, _allPages, lastPageParam) => lastPage.length === 25 ? lastPageParam + 25 : undefined,
  })
  const attachments = data.pages.flat()
  const ref = useRef(null)
  const inView = useInView(ref, { margin: "0px 0px 100% 0px" })
  const [enabled, setEnabled] = useState(false)
  useEffect(() => { if (attachments.length) setEnabled(true) }, [attachments.length])
  useEffect(() => {
    if (enabled && inView && hasNextPage) void fetchNextPage()
  }, [enabled, fetchNextPage, hasNextPage, inView])

  if (attachments.length === 0) return <div className="w-full aspect-2/1 flex items-center justify-center"><span className="text-muted-foreground">Корзина пуста</span></div>
  return <>
    <CardGrid attachments={attachments} visibility="private" inTrash />
    <div ref={ref} className="w-full py-6" />
  </>
}
