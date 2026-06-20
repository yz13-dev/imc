import { getInboxAttachments } from "@/lib/api/attachments"
import { getTagsStats } from "@/lib/tags"
import Header from "../components/header"
import TagStats from "../components/tags-stats"
import InboxGrid from "./components/inbox-grid"



export default async function Page() {
  const inbox = await getInboxAttachments()

  const attachments = (inbox || []).map(item => item.attachment)
  const tags = (attachments || [])?.flatMap(inbox => inbox.tags)
  const tagStats = getTagsStats(tags)

  return (
    <>
      <Header>
        <TagStats tags={tagStats} />
      </Header>
      <div className="w-full px-6 pt-6">
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
