import Header, { HeaderContent } from "../components/header"
import SidebarTrigger from "../components/header/sidebar-trigger"
import { CollectionsSkeleton } from "./components/collections"
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
        <CollectionsSkeleton />
      </div>
      <div className="w-full space-y-6 px-6 pt-6">
        <InboxGridSkeleton />
      </div>
    </>
  )
}
