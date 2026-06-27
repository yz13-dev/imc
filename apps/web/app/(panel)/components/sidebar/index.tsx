"use client"
import { getCollectionAttachments } from "@/lib/api/attachments";
import { useGlobalStore } from "@/lib/stores/global-store";
import type { Collection } from "@/types/collections";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarSeparator } from "@workspace/ui/components/sidebar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { PlusIcon, SquareLibraryIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import NewCollectionModal from "../modals/new-collection";
import SidebarNav from "./nav";

type AppSidebarProps = {
  username?: string
  email?: string
  collections?: Collection[]
}

export default function AppSidebar({ username = "", email = "", collections: defaultCollections = [] }: AppSidebarProps) {
  // const inbox = useGlobalStore(state => state.inbox)
  const collectionsItems = useGlobalStore(state => state.collectionsItems)
  const allCollections = useGlobalStore(state => state.collections)
  // const trash = useGlobalStore(state => state.trash)

  const collections = useMemo(() => {
    const unique = [...defaultCollections, ...allCollections].filter((item, index, self) =>
      index === self.findIndex((t) => t.id === item.id)
    )
    return unique
  }, [allCollections, defaultCollections])

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarNav username={username} />
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/new/card" />}>
                  <PlusIcon />
                  <span>Новая карточка</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Коллекции</SidebarGroupLabel>
          <NewCollectionModal>
            <SidebarGroupAction>
              <PlusIcon />
            </SidebarGroupAction>
          </NewCollectionModal>
          <SidebarGroupContent>
            <SidebarMenu>
              {
                collections
                  .map(collection => {
                    return <CollectionItem key={collection.id} collection={collection} username={username} />
                    const count = collectionsItems[collection.id]?.length ?? 0
                    return (
                      <SidebarMenuItem key={collection.id}>
                        <SidebarMenuButton render={<Link href={`/${username}/${collection.id}`} />}>
                          <SquareLibraryIcon />
                          <span>{collection.name}</span>
                        </SidebarMenuButton>
                        <SidebarMenuBadge>{count}</SidebarMenuBadge>
                      </SidebarMenuItem>
                    )
                  })
              }
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Avatar>
            <AvatarImage src={undefined} />
            <AvatarFallback className="uppercase">{username.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{username}</span>
            <span className="text-xs text-muted-foreground">{email}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

const CollectionItem = ({ username, collection }: { username: string; collection: Collection }) => {

  const { data, isLoading } = useQuery({
    queryKey: ["attachments", "collections", collection.id],
    queryFn: () => {
      const data = getCollectionAttachments(collection.id)
      return data
    }
  })

  const count = data?.length ?? 0
  return (
    <SidebarMenuItem key={collection.id}>
      <SidebarMenuButton render={<Link href={`/${username}/${collection.id}`} />}>
        <SquareLibraryIcon />
        <span>{collection.name}</span>
      </SidebarMenuButton>
      <SidebarMenuBadge>
        {isLoading ? <Skeleton className="h-5 w-6" /> : count}
      </SidebarMenuBadge>
    </SidebarMenuItem>
  )
}
