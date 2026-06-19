import { getAttachments } from "@/lib/api/attachments"
import { getTagsStats } from "@/lib/tags"
import CardGrid from "../components/card-grid"
import Header from "../components/header"
import TagStats from "../components/tags-stats"



export default async function Page() {
  const attachments = await getAttachments()

  const tags = (attachments || [])?.flatMap(attachment => attachment.tags)
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
        <CardGrid
          attachments={attachments || []}
          scope="ref"
        />
      </div>
    </>
  )
}
