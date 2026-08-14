
import { getCollectionAttachments } from "@/lib/api/attachments"
import { getQueryClient } from "@/lib/query-client"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import DefaultHeader from "../../components/default-header"
import TagStats from "../../components/tags-stats"
import CollectionGrid from "./components/collection-grid"

type PageProps = {
  params: Promise<{
    user: string
    collection: string
  }>
  searchParams: Promise<{
    id: string
  }>
}
export default async function Page({ params, searchParams }: PageProps) {
  const { user, collection } = await params
  const { id } = await searchParams

  const queryClient = getQueryClient()

  await queryClient
    .prefetchQuery({
      queryKey: ["attachments", "collections", collection],
      queryFn: () => {
        const data = getCollectionAttachments(collection)
        return data
      }
    })

  await queryClient.prefetchQuery({
    queryKey: ["tags", collection],
    queryFn: async () => (await getCollectionAttachments(collection)) || []
  })

  // const attachments = await getCollectionAttachments(collection)

  // const tags = [] // (attachments || [])?.flatMap(inbox => inbox.tags)
  // const tagStats = getTagsStats(tags)

  const scope = `${user}/${collection}`
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DefaultHeader>
        <TagStats collection={collection} />
      </DefaultHeader>
      {
        id &&
        <div className="absolute inset-0 w-full min-h-svh bg-background z-50"></div>
      }
      <div className="w-full px-6 pt-6">
        <CollectionGrid
          collection={collection}
          defaultAttachments={[]}
        />
      </div>
      <footer className="p-6">

      </footer>
    </HydrationBoundary>
  )
}
