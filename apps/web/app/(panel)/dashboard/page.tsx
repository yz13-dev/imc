import { getAllAttachments } from "@/lib/api/attachments";
import { getTagsStats } from "@/lib/tags";
import { AnimatePresence } from "motion/react";
import { Suspense } from "react";
import Header, { HeaderContent } from "../components/header";
import SidebarTrigger from "../components/header/sidebar-trigger";
import Attachment, { AttachmentSkeleton } from "../components/preview/attachment";
import Cover from "../components/preview/cover";
import TagStats from "../components/tags-stats";
import AutoLoader from "./components/auto-loader";


type PageProps = {
  searchParams: Promise<{
    attachment?: string
  }>
}

export default async function Page({ searchParams }: PageProps) {
  const { attachment } = await searchParams

  const attachments = await getAllAttachments()

  const tags = (attachments || [])?.flatMap(inbox => inbox.tags)
  const tagStats = getTagsStats(tags)

  return (
    <>
      <Header>
        <HeaderContent>
          <SidebarTrigger />
        </HeaderContent>
        <TagStats tags={tagStats} />
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
        <AutoLoader attachments={attachments || []} />
      </div>
    </>
  )
}
