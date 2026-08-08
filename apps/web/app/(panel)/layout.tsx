import { getMe } from "@/lib/me";
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

  if (!user) return redirect("/")

  return (
    <UserProvider user={user}>
      <ServerSideEvents />
      <SidebarProvider>
        <div className="w-full container mx-auto">
          {children}
        </div>
        <Panel />
      </SidebarProvider>
    </UserProvider>
  )
}
