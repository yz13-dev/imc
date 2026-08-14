"use client";
import { useDebounce } from "@/hooks/use-debounce";
import { getAllAttachments } from "@/lib/api/attachments";
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

  const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery<AttachmentWithMaybeTagsAndSource[], Error, InfiniteData<AttachmentWithMaybeTagsAndSource[], number>, QueryKey, number>({
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (!lastPage || lastPage.length === 0) return undefined
      return lastPageParam + 25
    },
    initialPageParam: 0,
    queryKey: ["attachments", tags],
    queryFn: async ({ pageParam }) => {
      const data = await getAllAttachments({ offset: pageParam, tags })
      return data || []
    }
  })

  const allAttachments = data.pages.flat()

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
        scope="ref"
        withPreview
      />
      <div ref={ref} className="w-full py-6" />
    </>
  )
}
