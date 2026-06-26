"use client"
import { getInboxAttachments } from "@/lib/api/attachments"
import type { InboxItem } from "@/types/inbox"
import { useSuspenseQuery } from "@tanstack/react-query"
import CardGrid from "../../components/card-grid"


type InboxGridProps = {
  defaultInbox?: InboxItem[]
}

export default function InboxGrid({ defaultInbox = [] }: InboxGridProps) {

  const { data } = useSuspenseQuery({ queryKey: ["inbox"], queryFn: getInboxAttachments })
  const attachments = (data || []).map(item => item.attachment) // useInboxAttachments({ inbox: defaultInbox })

  return (
    <>
      {
        (attachments || []).length === 0 &&
        <div className="w-full aspect-2/1 flex items-center justify-center">
          <span className="text-muted-foreground">Нет входящих</span>
        </div>
      }
      <CardGrid
        attachments={attachments || []}
        scope="ref"
        withPreview
      />
    </>
  )
}
