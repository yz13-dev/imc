import { getAllAttachments } from "@/lib/api/attachments";
import { getTagsWithCounts } from "@/lib/api/tags";
import { getQueryClient } from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import { Suspense } from "react";
import DefaultHeader from "../components/default-header";
import Attachment, { AttachmentSkeleton } from "../components/preview/attachment";
import Cover from "../components/preview/cover";
import TagStats from "../components/tags-stats";
import AutoLoader from "./components/auto-loader";




export default async function Page() {
  const queryClient = getQueryClient()

  // look ma, no await
  await queryClient.prefetchInfiniteQuery({
    initialPageParam: 0,
    queryKey: ["attachments", []],
    queryFn: async ({ pageParam }) => {
      const data = await getAllAttachments({ offset: pageParam, tags: [] })
      return data || []
    }
  })

  await queryClient.prefetchQuery({
    queryKey: ["tags", "all"],
    queryFn: async () => (await getTagsWithCounts()) || []
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DefaultHeader>
        <TagStats />
      </DefaultHeader>
      <AnimatePresence mode="popLayout">
        <Cover coverKey="attachment">
          <Suspense fallback={<AttachmentSkeleton />}>
            <Attachment />
          </Suspense>
        </Cover>
      </AnimatePresence>
      <div className="w-full space-y-6 px-6 pt-6">
        {/*{
        <CardGrid
          attachments={attachments || []}
          scope="ref"
          withPreview
        />
        }*/}
        <AutoLoader attachments={[]} />
      </div>
    </HydrationBoundary>
  )
}
