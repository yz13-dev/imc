"use client"

import { getCollections } from "@/lib/api/collections";
import { useUser } from "@/lib/stores/user";
import type { AttachmentWithMaybeTagsAndSource } from "@/types/attachments";
import { useQuery } from "@tanstack/react-query";
import { ReferenceHeader, ReferenceHeaderGroup } from "@workspace/ui/components/reference";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import { LockIcon, LockOpenIcon } from "lucide-react";
import Link from "next/link";

type CardHeaderProps = {
  attachment: AttachmentWithMaybeTagsAndSource;
  collectionSelector?: boolean
}
export default function CollectionCardHeader({ attachment, collectionSelector = false }: CardHeaderProps) {
  const user = useUser(state => state.user)
  const userId = user?.username || user?.id
  const { data } = useQuery({
    queryKey: ["attachments", "collections"],
    queryFn: () => getCollections(),
  })
  return (
    <ReferenceHeader>
      <ReferenceHeaderGroup>
        {
          collectionSelector &&
          <Select
          >
            <SelectTrigger
              className={cn(
                "bg-foreground/50 tabular-nums px-2 border-foreground/25 text-xs text-background! [&_svg]:text-background h-6! backdrop-blur-3xl"
              )}
            >
              <SelectValue placeholder="Коллекция" />
            </SelectTrigger>
            <SelectContent>
              {
                (data || [])
                  .map(collection => {
                    return (
                      <SelectItem
                        key={collection.id}
                        value={collection.id}
                        render={<Link href={`/${userId}/${collection.id}`} />}
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
