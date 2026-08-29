"use client"

import { useCollectionMultiSelect } from "@/hooks/use-collection-multi-select";
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments";
import { Button } from "@workspace/ui/components/button";
import { ReferenceBadge, ReferenceHeader, ReferenceHeaderGroup } from "@workspace/ui/components/reference";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import { LockIcon, LockOpenIcon, TagsIcon } from "lucide-react";

type CardHeaderProps = {
  attachment: AttachmentWithMaybeTagsAndSource;
  collectionSelector?: boolean
}
export default function CollectionCardHeader({ attachment, collectionSelector = false }: CardHeaderProps) {
  const collectionIds = attachment.collection_ids ?? []
  const tags = attachment.tags ?? []
  const firstTag = tags[0]?.tag?.name ?? ""
  const { collections, onValueChange, isPending } = useCollectionMultiSelect(attachment.id, collectionIds)
  return (
    <ReferenceHeader>
      <ReferenceHeaderGroup className="min-w-0">
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
                "h-6! text-text-background [&_svg]:text-background rounded-sm px-1.5"
              )}
              render={<Button />}
            >
              <SelectValue placeholder="Коллекция" className="text-background!">
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
      <ReferenceHeaderGroup className="min-w-0">
        {tags.length > 0 && (
          <ReferenceBadge className="min-w-0 max-w-full gap-1">
            <TagsIcon className="shrink-0 size-3!" />
            <span className="min-w-0 truncate uppercase" title={firstTag}>
              {firstTag}
            </span>
            {tags.length > 1 && <span className="shrink-0">+{tags.length - 1}</span>}
          </ReferenceBadge>
        )}
      </ReferenceHeaderGroup>
    </ReferenceHeader>
  )
}
