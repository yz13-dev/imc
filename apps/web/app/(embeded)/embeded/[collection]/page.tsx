import CollectionGrid from "@/app/(panel)/[user]/[collection]/components/collection-grid";
import { getPublicCollectionAttachments } from "@/lib/api/attachments";
import { dehydrateState, getQueryClient } from "@/lib/query-client";
import { HydrationBoundary } from "@tanstack/react-query";


type PageProps = {
  params: Promise<{
    collection: string
  }>
}

export default async function Page({ params }: PageProps) {

  const { collection } = await params;

  const queryClient = getQueryClient()

  const queryKey = ["public", "attachments", "collections", collection]

  await queryClient
    .prefetchQuery({
      queryKey,
      queryFn: () => {
        const data = getPublicCollectionAttachments(collection)
        return data
      }
    })

  return (
    <HydrationBoundary state={dehydrateState(queryClient)}>
      <CollectionGrid
        readonly
        collection={collection}
        defaultAttachments={[]}
        queryKey={queryKey}
        queryFn={getPublicCollectionAttachments(collection)}
      />
    </HydrationBoundary>
  )
}
