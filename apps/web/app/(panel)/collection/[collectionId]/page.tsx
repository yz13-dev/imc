
import { getCollectionAttachments } from "@/lib/api/attachments"
import { getTagsWithCounts } from "@/lib/api/tags"
import { dehydrateState, getQueryClient } from "@/lib/query-client"
import { HydrationBoundary } from "@tanstack/react-query"
import { parseAsArrayOf, parseAsString } from "nuqs/server"
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
    tags?: string | string[]
  }>
}
export default async function Page({ params, searchParams }: PageProps) {
  const { collectionId } = await params
  const { id, tags: rawTags } = await searchParams
  const tags = parseAsArrayOf(parseAsString).parseServerSide(rawTags) ?? []

  const queryClient = getQueryClient()
  const initialPage = await getCollectionAttachments(collectionId, { limit: 25, tags })
    ?? { items: [], next_cursor: "" }

  await queryClient.prefetchQuery({
    queryKey: ["tags", collectionId],
    queryFn: async () => (await getTagsWithCounts(collectionId)) || []
  })
  return (
    <HydrationBoundary state={dehydrateState(queryClient)}>
      <DefaultHeader />
      <TagPicker className="top-14 sticky">
        <TagStats collection={collectionId} />
      </TagPicker>
      {
        id &&
        <div className="absolute inset-0 w-full min-h-svh bg-background z-50"></div>
      }
      <div className="w-full px-6 pt-6">
        <CollectionGrid
          collection={collectionId}
          initialPage={initialPage}
          initialTags={tags}
        />
      </div>
      <footer className="p-6">

      </footer>
    </HydrationBoundary>
  )
}
