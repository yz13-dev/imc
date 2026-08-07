import { getMe } from "@/lib/me";
import { GlobalStoreProvider } from "@/lib/stores/global-store";
import { UserProvider } from "@/lib/stores/user";
import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { redirect } from "next/navigation";
import { Panel } from "./components/dock";
import ServerSideEvents from "./components/sse-provider";


type LayoutProps = {
  children: React.ReactNode
}

export default async function Layout({ children }: LayoutProps) {

  const user = await getMe()
  // const collectionsPromise = getCollections()
  // const inboxPromise = getInboxAttachments()
  // const allAttachmentsPromise = getAllAttachments()
  // const trashPromise = getTrashAttachments()

  if (!user) return redirect("/")

  return (
    <UserProvider user={user}>
      <GlobalStoreProvider
        collections={[]}
        inbox={[]}
        trash={[]}
        all={[]}
      >
        {/*<CollectionsCollector collections={collections || []} />*/}
        <ServerSideEvents />
        <SidebarProvider>
          {/*<AppSidebar username={username || undefined} email={email || undefined} collections={collections || []} />*/}
          <div className="w-full container mx-auto">
            {children}
          </div>
          <Panel />
        </SidebarProvider>
        {/*<Footer />*/}
      </GlobalStoreProvider>
    </UserProvider>
  )
}
