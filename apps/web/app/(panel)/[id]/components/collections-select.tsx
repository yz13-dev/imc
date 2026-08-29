"use client"

import { useCollectionMultiSelect } from "@/hooks/use-collection-multi-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"
import { LockIcon, LockOpenIcon } from "lucide-react"

type CollectionsSelectProps = {
  attachmentId: string
  collectionIds: string[]
  className?: string
}

export default function CollectionsSelect({ attachmentId, collectionIds, className }: CollectionsSelectProps) {
  const { collections, onValueChange, isPending } = useCollectionMultiSelect(attachmentId, collectionIds)
  return (
    <Select
      multiple
      value={collectionIds}
      disabled={isPending}
      onValueChange={onValueChange}
      itemToStringLabel={item => collections.find(collection => collection.id === item)?.name || item}
    >
      <SelectTrigger className={cn("bg-background", className)}>
        <SelectValue placeholder="Коллекция">
          {(value: string[]) => value.length > 0 ? `Коллекции (${value.length})` : "Коллекция"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {
          collections.map(collection => (
            <SelectItem key={collection.id} value={collection.id}>
              {collection.public ? <LockOpenIcon /> : <LockIcon />}
              <span>{collection.name}</span>
            </SelectItem>
          ))
        }
      </SelectContent>
    </Select>
  )
}
