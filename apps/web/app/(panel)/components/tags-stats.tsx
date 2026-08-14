"use client"
import { getTagsWithCounts } from "@/lib/api/tags";
import type { TagWithCount } from "@/types/attachments";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";

function Tags({ tags = [] }: { tags?: TagWithCount[] }) {

  const [tagQuery, setTagQuery] = useQueryState("tags", parseAsArrayOf(parseAsString))

  return tags
    .toSorted((a, b) => a.name.localeCompare(b.name))
    .map((tag) => {
      const isActive = tagQuery?.includes(tag.name)
      return (
        <Button
          key={tag.id}
          variant={isActive ? "default" : "outline"}
          onClick={() => setTagQuery(prev => {
            if (prev?.includes(tag.name)) {
              return prev.filter(t => t !== tag.name)
            }
            return [...(prev || []), tag.name]
          })}
        >
          <span>{tag.name}</span>
          <span className="text-muted-foreground">{tag.count}</span>
        </Button>
      )
    })
}

type TagStatsProps = {
  collection?: string;
}
export default function TagStats({ collection }: TagStatsProps) {

  const { data } = useSuspenseQuery<TagWithCount[]>({
    queryKey: collection ? ["tags", collection] : ["tags", "all"],
    queryFn: async () => (await getTagsWithCounts(collection)) || []
  })

  return (
    <div className="w-full px-4 flex items-center gap-2">
      <Tags tags={data} />
    </div>
  )
}

export function InboxTagStats() {

  const { data } = useQuery<TagWithCount[]>({
    queryKey: ["tags", "all"],
    queryFn: async () => (await getTagsWithCounts()) || []
  })

  return (
    <div className="w-full flex items-center gap-2">
      <Tags tags={data} />
    </div>
  )
}
