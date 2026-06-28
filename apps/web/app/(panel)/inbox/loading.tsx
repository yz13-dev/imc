import { CollectionCardSkeleton } from "@/components/collection-card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import CardGridWrapper from "../components/card-grid-wrapper"
import Header, { HeaderContent } from "../components/header"
import SidebarTrigger from "../components/header/sidebar-trigger"



export default function Loading() {
  return (
    <>
      <Header>
        <HeaderContent>
          <SidebarTrigger />
        </HeaderContent>
        <HeaderContent>
        </HeaderContent>
      </Header>
      <div className="w-full p-6">
        <div className="flex items-center gap-3 overflow-x-auto">
          <Skeleton className="min-w-48 rounded-sm aspect-square bg-muted relative" />
          <Skeleton className="min-w-48 rounded-sm aspect-square bg-muted relative" />
          <Skeleton className="min-w-48 rounded-sm aspect-square bg-muted relative" />
        </div>
      </div>
      <div className="w-full px-6 pt-6">
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
      </div>
    </>
  )
}
