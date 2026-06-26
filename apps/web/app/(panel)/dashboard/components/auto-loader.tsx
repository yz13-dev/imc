"use client";
import { useDebounce } from "@/hooks/use-debounce";
import { getAllAttachments } from "@/lib/api/attachments";
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments";
import type { InfiniteData } from "@tanstack/react-query";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import CardGrid from "../../components/card-grid";

export function AutoLoaderGrid() {

  return <div />
}

export default function AutoLoader({ attachments = [] }: { attachments?: AttachmentWithMaybeTagsAndSource[] }) {
  const [reachedEnd, setReachedEnd] = useState(false)

  const { data, fetchNextPage } = useSuspenseInfiniteQuery<AttachmentWithMaybeTagsAndSource[], Error, InfiniteData<AttachmentWithMaybeTagsAndSource[], number>, string[], number>({
    getNextPageParam: (lastPageParam, allPages, offset) => {
      return offset + 25
    },
    initialPageParam: 0,
    queryKey: ["attachments"],
    queryFn: async ({ pageParam }) => {
      const data = await getAllAttachments({ offset: pageParam })
      if (!data || data.length === 0) {
        setReachedEnd(true)
      }
      return data || []
    }
  })

  const all = data // useGlobalStore(state => state.all)
  const allAttachments = all.pages.flat()

  const ref = useRef(null)
  const inView = useInView(ref)

  const [disabled, setDisabled] = useState(true)

  const step = async () => {
    if (disabled || reachedEnd) return
    await fetchNextPage()
  }

  const debouncedInView = useDebounce(inView, 150)
  useEffect(() => {
    if (allAttachments.length !== 0) {
      setDisabled(false)
    }
  }, [allAttachments.length])
  useEffect(() => {
    console.log("IN-VIEW", debouncedInView, disabled)
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
