import { getCollections } from "@/lib/api/collections";
import { getMe } from "@/lib/me";
import { dehydrateState, getQueryClient } from "@/lib/query-client";
import { UserProvider } from "@/lib/stores/user";
import { HydrationBoundary } from "@tanstack/react-query";
import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { redirect } from "next/navigation";
import { Panel } from "./components/dock";
import ServerSideEvents from "./components/sse-provider";


type LayoutProps = {
  children: React.ReactNode
  modal: React.ReactNode
}

export default async function Layout({ children, modal }: LayoutProps) {

  const user = await getMe()

  if (!user) return redirect("/")

  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: ["attachments", "collections"],
    queryFn: () => getCollections(),
  })

  return (
    <UserProvider user={user}>
      <ServerSideEvents />
      <HydrationBoundary state={dehydrateState(queryClient)}>
        <SidebarProvider>
          <div className="w-full">
            {children}
          </div>
          {modal}
          <Panel />
        </SidebarProvider>
      </HydrationBoundary>
    </UserProvider>
  )
}
