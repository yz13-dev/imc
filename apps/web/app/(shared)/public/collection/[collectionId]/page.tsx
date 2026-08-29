import CollectionGrid from "@/app/(panel)/collection/[collectionId]/components/collection-grid"
import { getPublicCollectionAttachments } from "@/lib/api/attachments"
import { dehydrateState, getQueryClient } from "@/lib/query-client"
import { HydrationBoundary } from "@tanstack/react-query"

type PageProps = { params: Promise<{ collectionId: string }> }

export default async function Page({ params }: PageProps) {
  const { collectionId } = await params
  const queryKey = ["public", "attachments", "collections", collectionId]
  const queryClient = getQueryClient()
  const queryFn = getPublicCollectionAttachments(collectionId)

  await queryClient.prefetchQuery({ queryKey, queryFn: () => queryFn })

  return (
    <HydrationBoundary state={dehydrateState(queryClient)}>
      <CollectionGrid
        readonly
        collection={collectionId}
        defaultAttachments={[]}
        queryKey={queryKey}
        queryFn={queryFn}
      />
    </HydrationBoundary>
  )
}
