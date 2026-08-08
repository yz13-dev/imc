"use client"
import { moveAttachmentToCollection, removeAttachmentFromCollection } from "@/lib/api/attachments"
import type { AttachmentWithMaybeTagsAndSource, AttachmentWithTags } from "@/types/attachments"
import type { InboxItem } from "@/types/inbox"
import type { InfiniteData, QueryClient } from "@tanstack/react-query"
import { useMutation, useQueryClient } from "@tanstack/react-query"

type MoveAttachmentToCollectionVars = {
  attachmentId: string
  collectionId: string
}

// Every place an attachment can be cached (dashboard's infinite "all"
// list, a collection's contents, inbox, trash, the preview overlay) keeps
// its own copy of collection_ids. Rather than invalidating the whole
// ["attachments"] prefix — which would also refetch the dashboard's
// infinite query, page by page, on every toggle — patch collection_ids
// in place everywhere it's cached, using an id-list transform so each
// cache's own current value (which may already differ slightly) is
// updated consistently rather than overwritten with a single snapshot.
function patchAttachmentCollections(
  queryClient: QueryClient,
  attachmentId: string,
  updateIds: (ids: string[]) => string[],
) {
  const patch = <T extends { id: string; collection_ids?: string[] }>(attachment: T): T =>
    attachment.id === attachmentId
      ? { ...attachment, collection_ids: updateIds(attachment.collection_ids ?? []) }
      : attachment

  // Dashboard's infinite "all attachments" list.
  queryClient.setQueriesData<InfiniteData<AttachmentWithMaybeTagsAndSource[]>>(
    { queryKey: ["attachments"], exact: true },
    (data) => data && { ...data, pages: data.pages.map(page => page.map(patch)) }
  )

  // Any individual collection's contents currently cached — excludes the
  // bare collections *list* query (["attachments", "collections"]), which
  // holds Collection metadata, not attachments.
  queryClient.setQueriesData<AttachmentWithTags[]>(
    { queryKey: ["attachments", "collections"], predicate: (query) => query.queryKey.length === 3 },
    (data) => data?.map(patch)
  )

  // Inbox — the attachment is nested under `.attachment`.
  queryClient.setQueriesData<InboxItem[]>(
    { queryKey: ["attachments", "inbox"] },
    (data) => data?.map(item => ({ ...item, attachment: patch(item.attachment) }))
  )

  // Trash.
  queryClient.setQueriesData<AttachmentWithTags[]>(
    { queryKey: ["attachments", "trash"] },
    (data) => data?.map(patch)
  )

  // The preview overlay's single-attachment cache (see seedPreviewCache in
  // components/collection-card/index.tsx).
  queryClient.setQueryData<AttachmentWithMaybeTagsAndSource>(
    ["attachments", "ref", attachmentId],
    (data) => data && patch(data)
  )
}

function addId(ids: string[], id: string) {
  return ids.includes(id) ? ids : [...ids, id]
}

function removeId(ids: string[], id: string) {
  return ids.filter(existing => existing !== id)
}

export function useMoveAttachmentToCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ attachmentId, collectionId }: MoveAttachmentToCollectionVars) =>
      moveAttachmentToCollection(attachmentId, collectionId),
    onSuccess: (_data, { attachmentId, collectionId }) => {
      patchAttachmentCollections(queryClient, attachmentId, ids => addId(ids, collectionId))
    },
  })
}

type ToggleAttachmentCollectionVars = {
  attachmentId: string
  collectionId: string
  action: "add" | "remove"
}

export function useToggleAttachmentCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ attachmentId, collectionId, action }: ToggleAttachmentCollectionVars) =>
      action === "add"
        ? moveAttachmentToCollection(attachmentId, collectionId)
        : removeAttachmentFromCollection(attachmentId, collectionId),
    onSuccess: (_data, { attachmentId, collectionId, action }) => {
      patchAttachmentCollections(
        queryClient,
        attachmentId,
        ids => action === "add" ? addId(ids, collectionId) : removeId(ids, collectionId)
      )
    },
  })
}
