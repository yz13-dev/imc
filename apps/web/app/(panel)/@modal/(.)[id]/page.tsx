import AttachmentModal from "../../components/attachment-modal"
import AttachmentPage from "../../[id]/page"

type PageProps = { params: Promise<{ id: string }> }

export default async function Page({ params }: PageProps) {
  const { id } = await params

  return (
    <AttachmentModal>
      <AttachmentPage params={Promise.resolve({ id })} />
    </AttachmentModal>
  )
}
