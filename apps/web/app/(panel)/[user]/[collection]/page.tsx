
import { getCollectionAttachments } from "@/lib/api/attachments"
import Header from "../../components/header"
import CollectionGrid from "./components/collection-grid"


type PageProps = {
  params: Promise<{
    user: string
    collection: string
  }>
  searchParams: Promise<{
    id: string
  }>
}
export default async function Page({ params, searchParams }: PageProps) {
  const { user, collection } = await params
  const { id } = await searchParams

  const attachments = await getCollectionAttachments(collection)
  // const collectionCards = await getCollectionCards(collection)
  // console.log("collectionCards", collectionCards)

  const scope = `${user}/${collection}`
  return (
    <>
      <Header defaultCollection={collection} />
      {
        id &&
        <div className="absolute inset-0 w-full min-h-svh bg-background z-50"></div>
      }
      <div className="w-full px-6 pt-6">
        <CollectionGrid
          collection={collection}
          defaultAttachments={attachments || []}
        />
      </div>
      <footer className="p-6">

      </footer>
    </>
  )
}
