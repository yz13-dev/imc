"use client"
import { getAllAttachments, getInboxAttachments } from "@/lib/api/attachments";
import { getTagsStats, type TagStats } from "@/lib/tags";
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments";
import type { InboxItem } from "@/types/inbox";
import type { InfiniteData } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";

function getTagsFromData(data: any): AttachmentWithMaybeTagsAndSource[] {
  console.log("[DATA]", data)
  if (Array.isArray(data)) {
    return (data || []) as AttachmentWithMaybeTagsAndSource[]
  }
  if (typeof data === "object") {
    return (data as InfiniteData<AttachmentWithMaybeTagsAndSource[]>).pages.flat()
  }
  return (data || []) as AttachmentWithMaybeTagsAndSource[]
}

function Tags({ tags = {} }: { tags?: TagStats }) {

  const [tagQuery, setTagQuery] = useQueryState("tags", parseAsArrayOf(parseAsString))

  return Object.entries(tags)
    .toSorted(([a], [b]) => a.localeCompare(b))
    .map(([tagName, stat]) => {
      const isActive = tagQuery?.includes(tagName)
      return (
        <Button key={tagName} variant={isActive ? "default" : "outline"} onClick={() => setTagQuery(prev => {
          if (prev?.includes(tagName)) {
            return prev.filter(t => t !== tagName)
          }
          return [...(prev || []), tagName]
        })}>
          <span>{tagName}</span>
          <span className="text-muted-foreground">{stat.count}</span>
        </Button>
      )
    })
}

type TagStatsProps = {
  tags?: TagStats;
  queryKey?: string;
}
export default function TagStats({ queryKey }: TagStatsProps) {

  const { data } = useQuery<AttachmentWithMaybeTagsAndSource[]>({
    queryKey: queryKey ? [queryKey] : ["attachments"], queryFn: async () => {
      const data = await getAllAttachments()
      return (data || [])
    }
  })

  const tags = getTagsFromData(data)?.flatMap(item => item.tags)
  const tagStats = getTagsStats(tags)

  return (
    <div className="w-full px-4 flex items-center gap-2">
      <Tags tags={tagStats} />
    </div>
  )
}

export function InboxTagStats() {

  const { data } = useQuery<InboxItem[]>({
    queryKey: ["attachments", "inbox"], queryFn: async () => {
      const data = await getInboxAttachments()
      return (data || [])
    }
  })

  const tags = (data || [])?.map(item => item.attachment)?.flatMap(item => item.tags)
  const tagStats = getTagsStats(tags)

  return (
    <div className="w-full px-4 flex items-center gap-2">
      <Tags tags={tagStats} />
    </div>
  )
}
