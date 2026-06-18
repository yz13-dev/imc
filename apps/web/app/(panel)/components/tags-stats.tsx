import type { TagStats } from "@/lib/tags";
import { Button } from "@workspace/ui/components/button";



type TagStatsProps = {
  tags: TagStats;
}
export default function TagStats({ tags }: TagStatsProps) {

  return (
    <div className="w-full px-4 flex items-center gap-2">
      {
        Object.entries(tags).map(([tagName, stat]) => (
          <Button key={tagName} variant="outline">
            <span>{tagName}</span>
            <span className="text-muted-foreground">{stat.count}</span>
          </Button>
        ))
      }
    </div>
  )
}
