
import Header from "../../components/header"


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
        <div
          className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 space-y-4"
        >

          {/*{
            collections.map((item) => {
              return (
                <CollectionCard
                  key={item.id}
                  id={item.id}
                  src={item.src}
                  title={item.title}
                  scope={scope}
                />
              )
            })
          }*/}

        </div>
      </div>
      <footer className="p-6">

      </footer>
    </>
  )
}
