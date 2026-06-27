"use client"

import { getAllAttachments, getInboxAttachments, getTrashAttachments } from "@/lib/api/attachments"
import { useQuery } from "@tanstack/react-query"
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem } from "@workspace/ui/components/sidebar"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { InboxIcon, LayoutDashboardIcon, Trash2Icon } from "lucide-react"
import Link from "next/link"


export default function SidebarNav({ username }: { username?: string }) {

  const { data: all, isLoading: isLoadingAll } = useQuery({
    queryKey: ["attachments",],
    queryFn: () => getAllAttachments().then(data => data), // <-- serialize the data on the server
  })

  const { data: inbox, isLoading: isLoadingInbox } = useQuery({
    queryKey: ["attachments", "inbox"],
    queryFn: () => getInboxAttachments().then(data => data), // <-- serialize the data on the server
  })
  const { data: trash, isLoading: isLoadingTrash } = useQuery({
    queryKey: ["attachments", "trash"],
    queryFn: () => getTrashAttachments().then(data => data), // <-- serialize the data on the server
  })

  return (
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
            <SidebarMenuBadge>
              {isLoadingInbox ? <Skeleton className="h-5 w-6" /> : (inbox || []).length}
            </SidebarMenuBadge>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/trash" />}>
              <Trash2Icon />
              <span>Корзина</span>
            </SidebarMenuButton>
            <SidebarMenuBadge>
              {isLoadingTrash ? <Skeleton className="h-5 w-6" /> : (trash || []).length}
            </SidebarMenuBadge>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
