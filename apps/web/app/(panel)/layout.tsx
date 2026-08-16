import { getCollections } from "@/lib/api/collections";
import { getMe } from "@/lib/me";
import { dehydrateState, getQueryClient } from "@/lib/query-client";
import { UserProvider } from "@/lib/stores/user";
import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { Panel } from "./components/dock";
import ServerSideEvents from "./components/sse-provider";


type LayoutProps = {
  children: React.ReactNode
}

export default async function Layout({ children }: LayoutProps) {

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
          <div className="w-full container mx-auto">
            {children}
          </div>
          <Panel />
        </SidebarProvider>
      </HydrationBoundary>
    </UserProvider>
  )
}
