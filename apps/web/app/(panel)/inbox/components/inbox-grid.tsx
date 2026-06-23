"use client"
import { useInboxAttachments } from "@/hooks/use-inbox-attachments"
import type { InboxItem } from "@/types/inbox"
import CardGrid from "../../components/card-grid"


type InboxGridProps = {
  defaultInbox?: InboxItem[]
}

export default function InboxGrid({ defaultInbox = [] }: InboxGridProps) {

  const attachments = useInboxAttachments({ inbox: defaultInbox })

  return <CardGrid
    attachments={attachments || []}
    scope="ref"
    withPreview
  />
}
