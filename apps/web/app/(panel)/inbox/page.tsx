import { getCollectionAttachments, getInboxAttachments } from "@/lib/api/attachments"
import { getCollections } from "@/lib/api/collections"
import { dehydrateState, getQueryClient } from "@/lib/query-client"
import { HydrationBoundary } from "@tanstack/react-query"
import { AnimatePresence } from "motion/react"
import { Suspense } from "react"
import DefaultHeader from "../components/default-header"
import Attachment, { AttachmentSkeleton } from "../components/preview/attachment"
import Cover from "../components/preview/cover"
import TagPicker from "../components/tag-picker"
import { InboxTagStats } from "../components/tags-stats"
import Collections, { CollectionsSkeleton } from "./components/collections"
import InboxGrid, { InboxGridSkeleton } from "./components/inbox-grid"


export default async function Page() {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: ["attachments", "inbox", []],
    queryFn: () => getInboxAttachments([])
  })

  const collections = await queryClient.fetchQuery({
    queryKey: ["attachments", "collections"],
    queryFn: () => getCollections()
  })

  await Promise.all(
    (collections || []).map(collection =>
      queryClient.prefetchQuery({
        queryKey: ["attachments", "collections", collection.id],
        queryFn: () => getCollectionAttachments(collection.id)
      })
    )
  )

  return (
    <HydrationBoundary state={dehydrateState(queryClient)}>
      <DefaultHeader />
      <TagPicker className="top-14 sticky">
        <InboxTagStats />
      </TagPicker>
      <AnimatePresence mode="popLayout">
        <Cover coverKey="attachment">
          <Suspense fallback={<AttachmentSkeleton />}>
            <Attachment />
          </Suspense>
        </Cover>
      </AnimatePresence>
      <div className="w-full p-6">
        <Suspense fallback={<CollectionsSkeleton />}>
          <Collections />
        </Suspense>
      </div>
      <div className="w-full space-y-6 px-6 pt-6">
        <Suspense fallback={<InboxGridSkeleton />}>
          <InboxGrid />
        </Suspense>
      </div>
    </HydrationBoundary>
  )
}
