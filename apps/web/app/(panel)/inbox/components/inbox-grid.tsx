"use client"
import { useGlobalStore } from "@/lib/stores/global-store"
import type { InboxItem } from "@/types/inbox"
import { useMemo } from "react"
import CardGrid from "../../components/card-grid"


type InboxGridProps = {
  defaultInbox?: InboxItem[]
}

export default function InboxGrid({ defaultInbox = [] }: InboxGridProps) {

  const inbox = useGlobalStore(state => state.inbox);

  const merhedInbox = useMemo(() => {
    const unique = [...inbox, ...defaultInbox].filter((item, index, self) =>
      index === self.findIndex((t) => t.attachment_id === item.attachment_id)
    )
    return unique
  }, [inbox, defaultInbox])


  const attachments = (merhedInbox)
    .map(item => item.attachment)
    // @ts-expect-error
    .toSorted((a, b) => {
      const aDate = new Date(a.created_at)
      const bDate = new Date(b.created_at)
      return bDate.getTime() - aDate.getTime()
    })

  return (
    <CardGrid
      attachments={attachments || []}
      scope="ref"
    />
  )
}
