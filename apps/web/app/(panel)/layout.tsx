import { getCollections } from "@/lib/api/collections";
import { GlobalStoreProvider } from "@/lib/global-store";
import { getMe } from "@/lib/me";
import { UserProvider } from "@/lib/user";
import { SidebarProvider } from "@workspace/ui/components/sidebar";
import AppSidebar from "./components/sidebar";


type LayoutProps = {
  children: React.ReactNode
}

export default async function Layout({ children }: LayoutProps) {

  const userPromise = getMe()
  const collectionsPromise = getCollections()

  const [user, collections] = await Promise.all([userPromise, collectionsPromise])

  const username = user?.username
  console.log("user", user)
  console.log("username", username)
  return (
    <UserProvider user={user}>
      <GlobalStoreProvider collections={collections || []}>
        <SidebarProvider>
          <AppSidebar username={username || undefined} collections={collections || []} />
          <div className="w-full">
            {children}
          </div>
        </SidebarProvider>
      </GlobalStoreProvider>
    </UserProvider>
  )
}
