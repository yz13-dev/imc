import { getAllAttachments } from "@/lib/api/attachments";
import { getTagsStats } from "@/lib/tags";
import { AnimatePresence } from "motion/react";
import { Suspense } from "react";
import CardGrid from "../components/card-grid";
import Header from "../components/header";
import Attachment, { AttachmentSkeleton } from "../components/preview/attachment";
import Cover from "../components/preview/cover";
import TagStats from "../components/tags-stats";


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
        <TagStats tags={tagStats} />
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
        <CardGrid
          attachments={attachments || []}
          scope="ref"
          withPreview
        />
      </div>
    </>
  )
}
