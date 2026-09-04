"use client";
import { useDebounce } from "@/hooks/use-debounce";
import { getAllAttachments, type Page } from "@/lib/api/attachments";
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments";
import type { InfiniteData, QueryKey } from "@tanstack/react-query";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "motion/react";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import CardGrid from "../../components/card-grid";

export default function AutoLoader({ attachments = [] }: { attachments?: AttachmentWithMaybeTagsAndSource[] }) {

  const [tagQuery] = useQueryState("tags", parseAsArrayOf(parseAsString))
  const tags = tagQuery ?? []

  const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery<Page<AttachmentWithMaybeTagsAndSource>, Error, InfiniteData<Page<AttachmentWithMaybeTagsAndSource>, string | null>, QueryKey, string | null>({
    getNextPageParam: (lastPage) => lastPage?.next_cursor || undefined,
    initialPageParam: null,
    queryKey: ["attachments", tags],
    queryFn: async ({ pageParam }) => {
      const data = await getAllAttachments({ cursor: pageParam, tags })
      return data || { items: [], next_cursor: "" }
    }
  })

  // A refetch can overlap an already loaded cursor page while server state is
  // changing (for example when an attachment becomes public). The attachment
  // id is the stable identity, so never render the same record twice.
  const allAttachments = Array.from(
    new Map(data.pages.flatMap(page => page.items).map(attachment => [attachment.id, attachment])).values()
  )

  const ref = useRef(null)
  // Extends the sentinel's detection zone downward past the actual viewport
  // edge, so the next page starts loading while the user still has ~1
  // screen's worth of content left to scroll through, instead of only once
  // they hit the very bottom.
  const inView = useInView(ref, { margin: "0px 0px 100% 0px" })

  const [disabled, setDisabled] = useState(true)

  const step = async () => {
    if (disabled || !hasNextPage) return
    await fetchNextPage()
  }

  const debouncedInView = useDebounce(inView, 25)
  useEffect(() => {
    if (allAttachments.length !== 0) {
      setDisabled(false)
    }
  }, [allAttachments.length])
  useEffect(() => {
    if (disabled) return
    if (debouncedInView) {
      step()
    }
  }, [debouncedInView, disabled])
  return (
    <>
      <CardGrid
        collectionSelector
        attachments={allAttachments}
        visibility="private"
      />
      <div ref={ref} className="w-full py-6" />
    </>
  )
}
