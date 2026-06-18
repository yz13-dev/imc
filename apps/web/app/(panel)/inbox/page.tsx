import { getAttachments } from "@/lib/api/attachments"
import CardGrid from "../components/card-grid"
import Header from "../components/header"



export default async function Page() {
  const attachments = await getAttachments()
  console.log("attachments", attachments)
  return (
    <>
      <Header />
      <div className="w-full px-6 pt-6">
        <CardGrid
          attachments={attachments || []}
          scope="ref"
        />
      </div>
    </>
  )
}
