
import { getCollectionAttachments } from "@/lib/api/attachments"
import { getTagsWithCounts } from "@/lib/api/tags"
import { dehydrateState, getQueryClient } from "@/lib/query-client"
import { HydrationBoundary } from "@tanstack/react-query"
import DefaultHeader from "../../components/default-header"
import TagPicker from "../../components/tag-picker"
import TagStats from "../../components/tags-stats"
import CollectionGrid from "./components/collection-grid"

type PageProps = {
  params: Promise<{
    collectionId: string
  }>
  searchParams: Promise<{
    id: string
  }>
}
export default async function Page({ params, searchParams }: PageProps) {
  const { collectionId } = await params
  const { id } = await searchParams

  const queryClient = getQueryClient()

  await queryClient.prefetchInfiniteQuery({
    initialPageParam: 0,
    queryKey: ["attachments", "collections", collectionId, []],
    queryFn: ({ pageParam }) => getCollectionAttachments(collectionId, { offset: pageParam, limit: 25, tags: [] }),
  })

  await queryClient.prefetchQuery({
    queryKey: ["tags", collectionId],
    queryFn: async () => (await getTagsWithCounts(collectionId)) || []
  })
  return (
    <HydrationBoundary state={dehydrateState(queryClient)}>
      <DefaultHeader />
      <TagPicker className="top-14 sticky">
        <TagStats />
      </TagPicker>
      {
        id &&
        <div className="absolute inset-0 w-full min-h-svh bg-background z-50"></div>
      }
      <div className="w-full px-6 pt-6">
        <CollectionGrid
          collection={collectionId}
        />
      </div>
      <footer className="p-6">

      </footer>
    </HydrationBoundary>
  )
}
