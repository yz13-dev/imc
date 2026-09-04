import AttachmentModal from "@/app/(panel)/components/attachment-modal"
import PublicAttachmentPage from "../../[id]/page"

type PageProps = { params: Promise<{ id: string }> }

export default async function Page({ params }: PageProps) {
  const { id } = await params

  return (
    <AttachmentModal id={id} visibility="public">
      <PublicAttachmentPage
        params={Promise.resolve({ id })}
        searchParams={Promise.resolve({ hideTitle: "true", hideBlurhash: "true" })}
      />
    </AttachmentModal>
  )
}
