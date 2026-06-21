import { getInboxAttachments } from "@/lib/api/attachments"
import { getTagsStats } from "@/lib/tags"
import { AnimatePresence } from "motion/react"
import { Suspense } from "react"
import Header from "../components/header"
import Attachment, { AttachmentSkeleton } from "../components/preview/attachment"
import Cover from "../components/preview/cover"
import TagStats from "../components/tags-stats"
import Collections from "./components/collections"
import InboxGrid from "./components/inbox-grid"


type PageProps = {
  searchParams: Promise<{
    attachment?: string
  }>
}

export default async function Page({ searchParams }: PageProps) {
  const inbox = await getInboxAttachments()
  const { attachment } = await searchParams

  const attachments = (inbox || []).map(item => item.attachment)
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
        <Collections />
        {
          (attachments || []).length === 0 &&
          <div className="w-full aspect-2/1 flex items-center justify-center">
            <span className="text-muted-foreground">Нет входящих</span>
          </div>
        }
        <InboxGrid defaultInbox={inbox || []} />
      </div>
    </>
  )
}
