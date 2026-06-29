import { getInboxAttachments } from "@/lib/api/attachments"
import { getQueryClient } from "@/lib/query-client"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { AnimatePresence } from "motion/react"
import { Suspense } from "react"
import Header, { HeaderContent } from "../components/header"
import SidebarTrigger from "../components/header/sidebar-trigger"
import Attachment, { AttachmentSkeleton } from "../components/preview/attachment"
import Cover from "../components/preview/cover"
import { InboxTagStats } from "../components/tags-stats"
import Collections from "./components/collections"
import InboxGrid, { InboxGridSkeleton } from "./components/inbox-grid"


type PageProps = {
  searchParams: Promise<{
    attachment?: string
  }>
}

export default async function Page({ searchParams }: PageProps) {
  const { attachment } = await searchParams

  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: ["attachments", "inbox"],
    queryFn: () => getInboxAttachments().then(data => data), // <-- serialize the data on the server
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Header>
        <HeaderContent>
          <SidebarTrigger />
        </HeaderContent>
        <InboxTagStats />
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
      <div className="w-full p-6">
        <Collections />
      </div>
      <div className="w-full space-y-6 px-6 pt-6">
        <Suspense fallback={<InboxGridSkeleton />}>
          <InboxGrid defaultInbox={[]} />
        </Suspense>
      </div>
    </HydrationBoundary>
  )
}
