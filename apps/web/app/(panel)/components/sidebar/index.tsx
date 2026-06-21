"use client"
import { useGlobalStore } from "@/lib/global-store";
import type { Collection } from "@/types/collections";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem } from "@workspace/ui/components/sidebar";
import { InboxIcon, LayoutDashboardIcon, PlusIcon, SquareLibraryIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import NewCollectionModal from "../modals/new-collection";

type AppSidebarProps = {
  username?: string
  email?: string
  collections?: Collection[]
}

export default function AppSidebar({ username = "", email = "", collections = [] }: AppSidebarProps) {
  const inbox = useGlobalStore(state => state.inbox)
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/dashboard" />}>
                  <LayoutDashboardIcon />
                  <span>Все</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/inbox" />}>
                  <InboxIcon />
                  <span>Входящие</span>
                </SidebarMenuButton>
                <SidebarMenuBadge>{inbox.length}</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Trash2Icon />
                  <span>Корзина</span>
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
                    return (
                      <SidebarMenuItem key={collection.id}>
                        <SidebarMenuButton render={<Link href={`/${username}/${collection.id}`} />}>
                          <SquareLibraryIcon />
                          <span>{collection.name}</span>
                        </SidebarMenuButton>
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
