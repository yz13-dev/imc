import CardGridWrapper from "@/app/(panel)/components/card-grid-wrapper";
import { CollectionCardSkeleton } from "@/components/collection-card";



export default function Loading() {
  return (
    <CardGridWrapper>
      {
        [...Array(24)].map((_, i) => {
          const everyFourth = i % 4 === 0
          const everySecond = i % 2 === 0
          const everyThird = i % 3 === 0
          return <CollectionCardSkeleton key={i} className={everyFourth ? "aspect-square" : everyThird ? "aspect-9/16" : everySecond ? "aspect-video" : "aspect-square"} />
        })
      }
    </CardGridWrapper>
  )
}
