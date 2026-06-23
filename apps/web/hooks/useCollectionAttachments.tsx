"use client"

import { useGlobalStore } from "@/lib/stores/global-store"
import type { Attachment, AttachmentWithMaybeTagsAndSource } from "@/types/attachments"
import { useEffect } from "react"



type UseCollectionAttachmentsProps = {
  collection: string
  attachments?: Attachment[]
}

export const useCollectionAttachments = ({ collection, attachments: defaultAttachments = [] }: UseCollectionAttachmentsProps): AttachmentWithMaybeTagsAndSource[] => {

  const collectionItems = useGlobalStore((state) => state.collectionsItems)
  const setCollectionItems = useGlobalStore((state) => state.setCollectionItems)

  const attachments = (collectionItems[collection] ?? defaultAttachments)
    // @ts-expect-error
    .toSorted((a, b) => {
      const aDate = new Date(a.created_at)
      const bDate = new Date(b.created_at)
      return bDate.getTime() - aDate.getTime()
    })

  useEffect(() => {
    setCollectionItems(collection, attachments)
  }, [defaultAttachments, setCollectionItems, collection])
  return attachments
}
