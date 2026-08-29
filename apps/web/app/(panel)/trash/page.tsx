import { getTrashAttachments } from "@/lib/api/attachments"
import CardGrid from "../components/card-grid"
import Header from "../components/header"


export default async function Page() {
  const attachments = await getTrashAttachments()

  return (
    <>
      <Header>
      </Header>
      <div className="w-full space-y-6 px-6 pt-6">
        {
          (attachments || []).length === 0 &&
          <div className="w-full aspect-2/1 flex items-center justify-center">
            <span className="text-muted-foreground">Нет входящих</span>
          </div>
        }
        <CardGrid attachments={attachments || []} visibility="private" inTrash />
      </div>
    </>
  )
}
