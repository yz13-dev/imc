import CollectionGrid from "@/app/(panel)/collection/[collectionId]/components/collection-grid"
import { getPublicCollectionAttachments } from "@/lib/api/attachments"
import { dehydrateState, getQueryClient } from "@/lib/query-client"
import { HydrationBoundary } from "@tanstack/react-query"

type PageProps = { params: Promise<{ collectionId: string }> }

export default async function Page({ params }: PageProps) {
  const { collectionId } = await params
  const queryKey = ["public", "attachments", "collections", collectionId, []]
  const queryClient = getQueryClient()
  await queryClient.prefetchInfiniteQuery({
    initialPageParam: 0,
    queryKey,
    queryFn: ({ pageParam }) => getPublicCollectionAttachments(collectionId, { offset: pageParam, limit: 25 }),
  })

  return (
    <HydrationBoundary state={dehydrateState(queryClient)}>
      <CollectionGrid
        readonly
        collection={collectionId}
      />
    </HydrationBoundary>
  )
}
