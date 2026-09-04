"use client"

import { CollectionCardSkeleton } from "@/components/collection-card"
import CardGridWrapper from "./card-grid-wrapper"
import { skeletonAspectRatio } from "./skeleton-aspect-ratio"

export default function CardGridSkeleton({ count = 24 }: { count?: number }) {
  return (
    <CardGridWrapper
      count={count}
      getAspectRatio={skeletonAspectRatio}
      renderItem={(index) => (
        <CollectionCardSkeleton
          key={index}
          style={{ aspectRatio: skeletonAspectRatio(index) }}
        />
      )}
    />
  )
}
