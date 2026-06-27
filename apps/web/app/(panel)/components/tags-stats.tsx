"use client"
import { getAllAttachments } from "@/lib/api/attachments";
import { getTagsStats, type TagStats } from "@/lib/tags";
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments";
import type { InfiniteData } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";

function getTagsFromData(data: any): AttachmentWithMaybeTagsAndSource[] {
  if (typeof data === "object") {
    return (data as InfiniteData<AttachmentWithMaybeTagsAndSource[]>).pages.flat()
  }
  return (data || []) as AttachmentWithMaybeTagsAndSource[]
}

type TagStatsProps = {
  tags?: TagStats;
  queryKey?: string;
}
export default function TagStats({ queryKey }: TagStatsProps) {

  const [tagQuery, setTagQuery] = useQueryState("tags", parseAsArrayOf(parseAsString))

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
      {
        Object.entries(tagStats)
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
    </div>
  )
}
