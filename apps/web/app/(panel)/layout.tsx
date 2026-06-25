import CollectionsCollector from "@/components/collections-collector";
import { getAllAttachments, getInboxAttachments, getTrashAttachments } from "@/lib/api/attachments";
import { getCollections } from "@/lib/api/collections";
import { getMe } from "@/lib/me";
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
  const inboxPromise = getInboxAttachments()
  const allAttachmentsPromise = getAllAttachments()
  const trashPromise = getTrashAttachments()


  const [user, collections, inbox, trash, allAttachments] = await Promise.all([userPromise, collectionsPromise, inboxPromise, trashPromise, allAttachmentsPromise])
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
        inbox={inbox || []}
        trash={trash || []}
        all={allAttachments || []}
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
