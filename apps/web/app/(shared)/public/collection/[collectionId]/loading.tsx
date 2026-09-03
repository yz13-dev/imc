import CardGridWrapper from "@/app/(panel)/components/card-grid-wrapper"
import { skeletonAspectRatio } from "@/app/(panel)/components/skeleton-aspect-ratio"
import { CollectionCardSkeleton } from "@/components/collection-card"

export default function Loading() {
  return (
    <CardGridWrapper
      count={24}
      getAspectRatio={skeletonAspectRatio}
      renderItem={(i) => (
        <CollectionCardSkeleton key={i} style={{ aspectRatio: skeletonAspectRatio(i) }} />
      )}
    />
  )
}
