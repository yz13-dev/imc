import CardGridSkeleton from "../components/card-grid-skeleton"
import Header, { HeaderContent } from "../components/header"
import TagPicker from "../components/tag-picker"



export default function Loading() {
  return (
    <>
      <Header>
        <HeaderContent>
        </HeaderContent>
        <HeaderContent>
        </HeaderContent>
      </Header>
      <TagPicker className="top-14 sticky" />
      <div className="w-full px-6 pt-6">
        <CardGridSkeleton />
      </div>
    </>
  )
}
