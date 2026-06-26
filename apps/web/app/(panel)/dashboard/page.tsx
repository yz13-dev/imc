import { getAllAttachments } from "@/lib/api/attachments";
import { getQueryClient } from "@/lib/query-client";
import { AnimatePresence } from "motion/react";
import { Suspense } from "react";
import Header, { HeaderContent } from "../components/header";
import SidebarTrigger from "../components/header/sidebar-trigger";
import Attachment, { AttachmentSkeleton } from "../components/preview/attachment";
import Cover from "../components/preview/cover";
import AutoLoader from "./components/auto-loader";


type PageProps = {
  searchParams: Promise<{
    attachment?: string
  }>
}

export default async function Page({ searchParams }: PageProps) {
  const { attachment } = await searchParams

  const queryClient = getQueryClient()

  // look ma, no await
  await queryClient.prefetchInfiniteQuery({
    initialPageParam: 0,
    queryKey: ["attachments"],
    queryFn: async ({ pageParam }) => {
      const data = await getAllAttachments({ offset: pageParam })
      return data || []
    }
  })
  // const attachments = await getAllAttachments()

  // const tags = [] // (attachments || [])?.flatMap(inbox => inbox.tags)
  // const tagStats = getTagsStats(tags)

  return (
    <>
      <Header>
        <HeaderContent>
          <SidebarTrigger />
        </HeaderContent>
        {/*<TagStats queryKey="attachments" />*/}
        <HeaderContent>
        </HeaderContent>
      </Header>
      <AnimatePresence mode="popLayout">
        {
          attachment &&
          <Cover coverKey="attachment">
            <Suspense fallback={<AttachmentSkeleton />}>
              <Attachment attachmentId={attachment} />
            </Suspense>
          </Cover>
        }
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
    </>
  )
}
