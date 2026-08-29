import { getTrashAttachments } from "@/lib/api/attachments"
import { dehydrateState, getQueryClient } from "@/lib/query-client"
import { HydrationBoundary } from "@tanstack/react-query"
import Header from "../components/header"
import TrashAutoLoader from "./components/auto-loader"

export default async function Page() {
  const queryClient = getQueryClient()
  await queryClient.prefetchInfiniteQuery({
    initialPageParam: null as string | null,
    queryKey: ["attachments", "trash"],
    queryFn: ({ pageParam }) => getTrashAttachments({ cursor: pageParam, limit: 25 }),
  })

  return <HydrationBoundary state={dehydrateState(queryClient)}>
    <Header />
    <div className="w-full space-y-6 px-6 pt-6"><TrashAutoLoader /></div>
  </HydrationBoundary>
}
