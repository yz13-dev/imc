import { getCards } from "@/lib/api/cards";
import { getCollections } from "@/lib/api/collections";
import Header from "../components/header";



export default async function Page() {

  const cards = await getCards()
  const collections = await getCollections();

  console.log("cards", cards)
  console.log("collections", collections)

  return (
    <>
      <Header />

    </>
  )
}
