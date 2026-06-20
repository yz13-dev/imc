import { getCollections } from "@/lib/api/collections";
import { GlobalStoreProvider } from "@/lib/global-store";
import { getMe } from "@/lib/me";
import { UserProvider } from "@/lib/user";
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

  const [user, collections] = await Promise.all([userPromise, collectionsPromise])
  if (!user) return redirect("/")

  // const userId = user.id
  const username = user.username
  const email = user.email
  // console.log("user", user)
  // console.log("username", username)

  return (
    <UserProvider user={user}>
      <GlobalStoreProvider collections={collections || []}>
        <ServerSideEvents />
        <SidebarProvider>
          <AppSidebar username={username || undefined} email={email || undefined} collections={collections || []} />
          <div className="w-full">
            {children}
          </div>
        </SidebarProvider>
      </GlobalStoreProvider>
    </UserProvider>
  )
}
