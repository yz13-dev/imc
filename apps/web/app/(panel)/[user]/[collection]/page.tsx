
import { getCollectionAttachments } from "@/lib/api/attachments"
import { getQueryClient } from "@/lib/query-client"
import Header, { HeaderContent } from "../../components/header"
import CollectionMenu from "../../components/header/collection-menu"
import CollectionSelect from "../../components/header/collection-select"
import SidebarTrigger from "../../components/header/sidebar-trigger"
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

  queryClient
    .prefetchQuery({
      queryKey: ["collections", collection],
      queryFn: () => {
        const data = getCollectionAttachments(collection)
        return data
      }
    })

  // const attachments = await getCollectionAttachments(collection)

  // const tags = [] // (attachments || [])?.flatMap(inbox => inbox.tags)
  // const tagStats = getTagsStats(tags)

  const scope = `${user}/${collection}`
  return (
    <>
      <Header>
        <HeaderContent>
          <SidebarTrigger />
          <CollectionSelect defaultCollection={collection} />
        </HeaderContent>
        <TagStats queryKey={collection} />
        <HeaderContent>
          <CollectionMenu collectionId={collection} />
        </HeaderContent>
      </Header>
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
    </>
  )
}
