"use client"
import { getAllAttachments } from "@/lib/api/attachments";
import { getTagsStats, type TagStats } from "@/lib/tags";
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";



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

  const tags = (data || [])?.flatMap(item => item.tags)
  const tagStats = getTagsStats(tags)

  return (
    <div className="w-full px-4 flex items-center gap-2">
      {
        Object.entries(tagStats)
          .map(([tagName, stat]) => (
            <Button key={tagName} variant="outline">
              <span>{tagName}</span>
              <span className="text-muted-foreground">{stat.count}</span>
            </Button>
          ))
      }
    </div>
  )
}
