import { CollectionCardSkeleton } from "@/components/collection-card"
import CardGridWrapper from "../components/card-grid-wrapper"
import Header, { HeaderContent } from "../components/header"
import { skeletonAspectRatio } from "../components/skeleton-aspect-ratio"
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
        <CardGridWrapper
          count={24}
          getAspectRatio={skeletonAspectRatio}
          renderItem={(i) => (
            <CollectionCardSkeleton key={i} style={{ aspectRatio: skeletonAspectRatio(i) }} />
          )}
        />
      </div>
    </>
  )
}
