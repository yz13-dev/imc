import { getAttachments } from "@/lib/api/attachments"



export default async function Page() {
  const attachments = await getAttachments()
  console.log("attachments", attachments)
  return null
}
