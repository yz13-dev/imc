import CollectionsCollector from "@/components/collections-collector";
import { getAllAttachments, getInboxAttachments, getTrashAttachments } from "@/lib/api/attachments";
import { getCollections } from "@/lib/api/collections";
import { getMe } from "@/lib/me";
import { getQueryClient } from "@/lib/query-client";
import { GlobalStoreProvider } from "@/lib/stores/global-store";
import { UserProvider } from "@/lib/stores/user";
import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { redirect } from "next/navigation";
import AppSidebar from "./components/sidebar";
import ServerSideEvents from "./components/sse-provider";


type LayoutProps = {
  children: React.ReactNode
}

export default async function Layout({ children }: LayoutProps) {

  const userPromise = getMe()
  const collectionsPromise = getCollections()
  // const inboxPromise = getInboxAttachments()
  // const allAttachmentsPromise = getAllAttachments()
  // const trashPromise = getTrashAttachments()

  const queryClient = getQueryClient()

  if (false) {
    queryClient
      .prefetchQuery({
        queryKey: ["attachments", "inbox"],
        queryFn: () => getInboxAttachments().then(data => data), // <-- serialize the data on the server
      })
    queryClient
      .prefetchQuery({
        queryKey: ["attachments"],
        queryFn: () => getAllAttachments().then(data => data), // <-- serialize the data on the server
      })
    queryClient
      .prefetchQuery({
        queryKey: ["attachments", "trash"],
        queryFn: () => getTrashAttachments().then(data => data), // <-- serialize the data on the server
      })
  }

  const [user, collections] = await Promise.all([userPromise, collectionsPromise])
  if (!user) return redirect("/")

  // const userId = user.id
  const username = user.username
  const email = user.email
  // console.log("user", user)
  // console.log("username", username)

  return (
    <UserProvider user={user}>
      <GlobalStoreProvider
        collections={collections || []}
        inbox={[]}
        trash={[]}
        all={[]}
      >
        <CollectionsCollector collections={collections || []} />
        <ServerSideEvents />
        <SidebarProvider>
          <AppSidebar username={username || undefined} email={email || undefined} collections={collections || []} />
          <div className="w-full">
            {children}
          </div>
        </SidebarProvider>
        {/*<Footer />*/}
      </GlobalStoreProvider>
    </UserProvider>
  )
}
