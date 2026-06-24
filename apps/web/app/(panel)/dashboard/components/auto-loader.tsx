"use client";
import { useAllAttachments } from "@/hooks/use-all-attachments";
import { useDebounce } from "@/hooks/use-debounce";
import { getAllAttachments } from "@/lib/api/attachments";
import { useGlobalStore } from "@/lib/stores/global-store";
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments";
import { useInView } from "motion/react";
import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import CardGrid from "../../components/card-grid";

export function AutoLoaderGrid() {

  return <div />
}

export default function AutoLoader({ attachments = [] }: { attachments?: AttachmentWithMaybeTagsAndSource[] }) {

  const all = useGlobalStore(state => state.all)
  const setAttachments = useGlobalStore(state => state.setAll)
  const ref = useRef(null)
  const [offset, setOffset] = useQueryState("offset", parseAsInteger)
  const inView = useInView(ref)

  const [disabled, setDisabled] = useState(true)
  const [reachedEnd, setReachedEnd] = useState(false)

  const step = () => {
    const STEP = 25
    const newOffset = (offset || 0) + STEP
    setOffset(newOffset)
    loadMore(newOffset)
  }
  const loadMore = async (offset: number) => {
    console.log("offset", offset)
    const attachments = await getAllAttachments({ offset })
    console.log("attachments", attachments)

    if (!attachments || attachments.length === 0) {
      setReachedEnd(true)
      return
    }

    setAttachments([...all, ...(attachments || [])])
  }

  const allAttachments = useAllAttachments({ attachments })
  console.log("IN-VIEW", inView)
  console.log("-", !reachedEnd && allAttachments.length !== 0)

  const debouncedInView = useDebounce(inView, 150)
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
      {
        !reachedEnd &&
        <div ref={ref} className="w-full py-6" />
      }
    </>
  )
}
