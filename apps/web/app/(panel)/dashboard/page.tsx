import { getAllAttachments } from "@/lib/api/attachments";
import { getTagsWithCounts } from "@/lib/api/tags";
import { dehydrateState, getQueryClient } from "@/lib/query-client";
import { HydrationBoundary } from "@tanstack/react-query";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@workspace/ui/components/input-group";
import { SearchIcon } from "lucide-react";
import DefaultHeader from "../components/default-header";
import TagPicker from "../components/tag-picker";
import TagStats from "../components/tags-stats";
import AutoLoader from "./components/auto-loader";




export default async function Page() {
  const queryClient = getQueryClient()

  // look ma, no await
  await queryClient.prefetchInfiniteQuery({
    initialPageParam: null as string | null,
    queryKey: ["attachments", []],
    queryFn: async ({ pageParam }) => {
      const data = await getAllAttachments({ cursor: pageParam, tags: [] })
      return data || { items: [], next_cursor: "" }
    }
  })

  await queryClient.prefetchQuery({
    queryKey: ["tags", "all"],
    queryFn: async () => (await getTagsWithCounts()) || []
  })

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
        <TagStats />
      </TagPicker>
      <div className="w-full space-y-6 px-6 pt-6">
        {/*{
        <CardGrid
          attachments={attachments || []}
        visibility="private"
        />
        }*/}
        <AutoLoader />
      </div>
    </HydrationBoundary>
  )
}
