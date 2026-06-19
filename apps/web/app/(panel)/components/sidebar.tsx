import type { Collection } from "@/types/collections";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@workspace/ui/components/sidebar";
import { InboxIcon, LayoutDashboardIcon, PlusIcon, SquareLibraryIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import NewCollectionModal from "./modals/new-collection";

type AppSidebarProps = {
  username?: string
  collections?: Collection[]
}

export default function AppSidebar({ username = "", collections = [] }: AppSidebarProps) {
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
    </Sidebar>
  )
}
