"use client"

import { useGlobalStore } from "@/lib/stores/global-store"
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments"
import { useEffect, useMemo } from "react"



type UseAllAttachmentsProps = {
  attachments?: AttachmentWithMaybeTagsAndSource[]
}

export const useAllAttachments = ({ attachments: defaultAttachments = [] }: UseAllAttachmentsProps): AttachmentWithMaybeTagsAndSource[] => {

  const all = useGlobalStore((state) => state.all)
  const setAll = useGlobalStore((state) => state.setAll)

  const attachments = useMemo(() => (all ?? defaultAttachments)
    // @ts-expect-error
    .toSorted((a, b) => {
      const aDate = new Date(a.created_at)
      const bDate = new Date(b.created_at)
      return bDate.getTime() - aDate.getTime()
    }), [all, defaultAttachments])

  useEffect(() => {
    setAll(defaultAttachments)
  }, [defaultAttachments, setAll])
  return attachments
}
