import { getCollectionAttachments, getInboxAttachments } from "@/lib/api/attachments"
import { getCollections } from "@/lib/api/collections"
import { dehydrateState, getQueryClient } from "@/lib/query-client"
import { HydrationBoundary } from "@tanstack/react-query"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@workspace/ui/components/input-group"
import { SearchIcon } from "lucide-react"
import { Suspense } from "react"
import DefaultHeader from "../components/default-header"
import TagPicker from "../components/tag-picker"
import { InboxTagStats } from "../components/tags-stats"
import Collections, { CollectionsSkeleton } from "./components/collections"
import InboxGrid, { InboxGridSkeleton } from "./components/inbox-grid"


export default async function Page() {
  const queryClient = getQueryClient()

  await queryClient.prefetchInfiniteQuery({
    initialPageParam: null as string | null,
    queryKey: ["attachments", "inbox", []],
    queryFn: async ({ pageParam }) => {
      const page = await getInboxAttachments({ cursor: pageParam, limit: 25, tags: [] })
      return {
        items: (page?.items || []).map(item => item.attachment),
        next_cursor: page?.next_cursor || "",
      }
    }
  })

  const collections = await queryClient.fetchQuery({
    queryKey: ["attachments", "collections"],
    queryFn: () => getCollections()
  })

  await Promise.all(
    (collections || []).map(collection =>
      queryClient.prefetchQuery({
        queryKey: ["attachments", "collections", collection.id],
        queryFn: () => getCollectionAttachments(collection.id, { limit: 3 })
      })
    )
  )

  return (
    <HydrationBoundary state={dehydrateState(queryClient)}>
      <DefaultHeader>
        <InputGroup className="max-w-2xl hidden mx-auto">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput placeholder="Поиск" />
        </InputGroup>
      </DefaultHeader>
      <TagPicker className="top-14 sticky">
        <InboxTagStats />
      </TagPicker>
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
