"use client"

import { useGlobalStore } from "@/lib/stores/global-store"
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments"
import type { InboxItem } from "@/types/inbox"
import { useEffect } from "react"



type UseInboxAttachmentsProps = {
  inbox?: InboxItem[]
}

export const useInboxAttachments = ({ inbox: defaultInbox = [] }: UseInboxAttachmentsProps): AttachmentWithMaybeTagsAndSource[] => {

  const inbox = useGlobalStore((state) => state.inbox)
  const setInbox = useGlobalStore((state) => state.setInbox)

  const attachments = inbox
    .map((item) => item.attachment)
    // @ts-expect-error
    .toSorted((a, b) => {
      const aDate = new Date(a.created_at)
      const bDate = new Date(b.created_at)
      return bDate.getTime() - aDate.getTime()
    })

  useEffect(() => {
    if (defaultInbox.length === 0) return
    setInbox(defaultInbox)
  }, [defaultInbox, setInbox])
  return attachments
}
