import CardGridWrapper from "@/app/(panel)/components/card-grid-wrapper"
import { CollectionCardSkeleton } from "@/components/collection-card"

export default function Loading() {
  return (
    <CardGridWrapper>
      {[...Array(24)].map((_, i) => (
        <CollectionCardSkeleton
          key={i}
          className={i % 4 === 0 ? "aspect-square" : i % 3 === 0 ? "aspect-9/16" : i % 2 === 0 ? "aspect-video" : "aspect-square"}
        />
      ))}
    </CardGridWrapper>
  )
}
