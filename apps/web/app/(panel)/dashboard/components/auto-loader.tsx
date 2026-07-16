"use client";
import { useDebounce } from "@/hooks/use-debounce";
import { getAllAttachments } from "@/lib/api/attachments";
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments";
import type { InfiniteData } from "@tanstack/react-query";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "motion/react";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import CardGrid from "../../components/card-grid";

export function AutoLoaderGrid() {

  return <div />
}

export default function AutoLoader({ attachments = [] }: { attachments?: AttachmentWithMaybeTagsAndSource[] }) {

  const [tagQuery] = useQueryState("tags", parseAsArrayOf(parseAsString))

  const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery<AttachmentWithMaybeTagsAndSource[], Error, InfiniteData<AttachmentWithMaybeTagsAndSource[], number>, string[], number>({
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (!lastPage || lastPage.length === 0) return undefined
      return lastPageParam + 25
    },
    initialPageParam: 0,
    queryKey: ["attachments"],
    queryFn: async ({ pageParam }) => {
      const data = await getAllAttachments({ offset: pageParam })
      return data || []
    }
  })

  const allAttachments = data.pages.flat().filter(attachment => {
    if (!tagQuery) return true
    return tagQuery.every(tag => attachment.tags.some(t => t.tag.name.includes(tag)))
  })

  const ref = useRef(null)
  const inView = useInView(ref)

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
        attachments={allAttachments}
        scope="ref"
        withPreview
      />
      <div ref={ref} className="w-full py-6" />
    </>
  )
}
