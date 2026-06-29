import CollectionGrid from "@/app/(panel)/[user]/[collection]/components/collection-grid";
import { getCollectionAttachments } from "@/lib/api/attachments";
import { getQueryClient } from "@/lib/query-client";


type PageProps = {
  params: Promise<{
    collection: string
  }>
}

export default async function Page({ params }: PageProps) {

  const { collection } = await params;

  const queryClient = getQueryClient()

  await queryClient
    .prefetchQuery({
      queryKey: ["attachments", "collections", collection],
      queryFn: () => {
        const data = getCollectionAttachments(collection)
        return data
      }
    })

  return (
    <CollectionGrid
      readonly
      collection={collection}
      defaultAttachments={[]}
    />
  )
}
