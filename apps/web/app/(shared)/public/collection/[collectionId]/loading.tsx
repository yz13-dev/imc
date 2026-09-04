import CardGridSkeleton from "@/app/(panel)/components/card-grid-skeleton"
import Header, { HeaderContent } from "@/app/(panel)/components/header"
import TagPicker from "@/app/(panel)/components/tag-picker"

export default function Loading() {
  return (
    <>
      <Header>
        <HeaderContent />
        <HeaderContent />
      </Header>
      <TagPicker className="sticky top-14" />
      <div className="w-full px-6 pt-6">
        <CardGridSkeleton />
      </div>
    </>
  )
}
