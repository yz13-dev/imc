"use client"

import { useCollectionMultiSelect } from "@/hooks/use-collection-multi-select";
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments";
import { ReferenceHeader, ReferenceHeaderGroup } from "@workspace/ui/components/reference";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import { LockIcon, LockOpenIcon } from "lucide-react";

type CardHeaderProps = {
  attachment: AttachmentWithMaybeTagsAndSource;
  collectionSelector?: boolean
}
export default function CollectionCardHeader({ attachment, collectionSelector = false }: CardHeaderProps) {
  const collectionIds = attachment.collection_ids ?? []
  const { collections, onValueChange, isPending } = useCollectionMultiSelect(attachment.id, collectionIds)
  return (
    <ReferenceHeader>
      <ReferenceHeaderGroup>
        {
          collectionSelector &&
          <Select
            multiple
            value={collectionIds}
            disabled={isPending}
            onValueChange={onValueChange}
            itemToStringLabel={item => collections.find(collection => collection.id === item)?.name || item}
          >
            <SelectTrigger
              className={cn(
                "bg-foreground/50 tabular-nums px-2 border-foreground/25 text-xs text-background! [&_svg]:text-background h-6! backdrop-blur-3xl"
              )}
            >
              <SelectValue placeholder="Коллекция">
                {(value: string[]) => value.length > 0 ? `Коллекции (${value.length})` : "Коллекция"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {
                collections
                  .map(collection => {
                    return (
                      <SelectItem
                        key={collection.id}
                        value={collection.id}
                      >
                        {collection?.public ? <LockOpenIcon /> : <LockIcon />}
                        <span>{collection.name}</span>
                      </SelectItem>
                    )
                  })
              }
            </SelectContent>
          </Select>
        }
      </ReferenceHeaderGroup>
      <ReferenceHeaderGroup>
      </ReferenceHeaderGroup>
    </ReferenceHeader>
  )
}
