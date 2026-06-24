import { getTrashAttachments } from "@/lib/api/attachments"
import { AnimatePresence } from "motion/react"
import { Suspense } from "react"
import CardGrid from "../components/card-grid"
import Header from "../components/header"
import Attachment, { AttachmentSkeleton } from "../components/preview/attachment"
import Cover from "../components/preview/cover"


type PageProps = {
  searchParams: Promise<{
    attachment?: string
  }>
}

export default async function Page({ searchParams }: PageProps) {
  const { attachment } = await searchParams

  const attachments = await getTrashAttachments()

  return (
    <>
      <Header>
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
        {
          (attachments || []).length === 0 &&
          <div className="w-full aspect-2/1 flex items-center justify-center">
            <span className="text-muted-foreground">Нет входящих</span>
          </div>
        }
        <CardGrid attachments={attachments || []} withPreview scope="ref" />
      </div>
    </>
  )
}
