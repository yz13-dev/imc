import AttachmentPage from "../../[id]/page"
import AttachmentModal from "../../components/attachment-modal"

type PageProps = { params: Promise<{ id: string }> }

export default async function Page({ params }: PageProps) {
  const { id } = await params

  return (
    <AttachmentModal id={id}>
      <AttachmentPage
        params={Promise.resolve({ id })}
        searchParams={Promise.resolve({ hideTitle: "true", hideBlurhash: "true" })}
      />
    </AttachmentModal>
  )
}
