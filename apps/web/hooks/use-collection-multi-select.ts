"use client"
import { getCollections } from "@/lib/api/collections"
import { useQuery } from "@tanstack/react-query"
import { useToggleAttachmentCollection } from "./use-move-to-collection"

export function useCollectionMultiSelect(attachmentId: string, collectionIds: string[] = []) {
  const { data: collections } = useQuery({
    queryKey: ["attachments", "collections"],
    queryFn: () => getCollections(),
  })

  const toggleMutation = useToggleAttachmentCollection()

  // Base UI's multi-select Select always reports the *full* next selection,
  // one item added or removed per interaction — diff against the current
  // (server-derived) collection_ids to figure out which single toggle to fire.
  const onValueChange = (nextIds: string[]) => {
    const added = nextIds.find(id => !collectionIds.includes(id))
    if (added) {
      toggleMutation.mutate({ attachmentId, collectionId: added, action: "add" })
      return
    }
    const removed = collectionIds.find(id => !nextIds.includes(id))
    if (removed) {
      toggleMutation.mutate({ attachmentId, collectionId: removed, action: "remove" })
    }
  }

  return {
    collections: collections ?? [],
    onValueChange,
    isPending: toggleMutation.isPending,
  }
}
