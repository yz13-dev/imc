import { Skeleton } from "@workspace/ui/components/skeleton"
import Header, { HeaderContent } from "../components/header"
import SidebarTrigger from "../components/header/sidebar-trigger"
import { InboxGridSkeleton } from "./components/inbox-grid"



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
        <InboxGridSkeleton />
      </div>
    </>
  )
}
