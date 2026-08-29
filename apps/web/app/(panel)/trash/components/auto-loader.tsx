"use client"
import { getTrashAttachments, type Page } from "@/lib/api/attachments"
import { useSelection } from "@/lib/stores/selection-store"
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments"
import type { InfiniteData, QueryKey } from "@tanstack/react-query"
import { useSuspenseInfiniteQuery } from "@tanstack/react-query"
import { useInView } from "motion/react"
import { useEffect, useRef, useState } from "react"
import CardGrid from "../../components/card-grid"
import { TrashSelectionDockSync } from "./bulk-actions"

export default function TrashAutoLoader() {
  const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery<Page<AttachmentWithMaybeTagsAndSource>, Error, InfiniteData<Page<AttachmentWithMaybeTagsAndSource>, string | null>, QueryKey, string | null>({
    initialPageParam: null,
    queryKey: ["attachments", "trash"],
    queryFn: async ({ pageParam }) => await getTrashAttachments({ cursor: pageParam, limit: 25 }) || { items: [], next_cursor: "" },
    getNextPageParam: (lastPage) => lastPage.next_cursor || undefined,
  })
  const attachments = data.pages.flatMap(page => page.items)
  const ref = useRef(null)
  const inView = useInView(ref, { margin: "0px 0px 100% 0px" })
  const [enabled, setEnabled] = useState(false)
  useEffect(() => { if (attachments.length) setEnabled(true) }, [attachments.length])
  useEffect(() => {
    if (enabled && inView && hasNextPage) void fetchNextPage()
  }, [enabled, fetchNextPage, hasNextPage, inView])

  const clearSelection = useSelection(state => state.clear)
  useEffect(() => () => clearSelection(), [clearSelection])

  if (attachments.length === 0) return <div className="w-full aspect-2/1 flex items-center justify-center"><span className="text-muted-foreground">Корзина пуста</span></div>
  return <>
    <TrashSelectionDockSync />
    <CardGrid attachments={attachments} visibility="private" inTrash selectable />
    <div ref={ref} className="w-full py-6" />
  </>
}
