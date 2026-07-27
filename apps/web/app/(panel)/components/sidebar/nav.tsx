"use client"

import { getInboxAttachments, getTrashAttachments } from "@/lib/api/attachments"
import { useQuery } from "@tanstack/react-query"
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton } from "@workspace/ui/components/sidebar"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { InboxIcon, LayoutDashboardIcon, Trash2Icon } from "lucide-react"
import Link from "next/link"

export function SidebarNavItemSkeleton() {
  return (
    <SidebarMenuItem>
      <SidebarMenuSkeleton />
      <SidebarMenuBadge>
        <Skeleton className="h-5 w-6" />
      </SidebarMenuBadge>
    </SidebarMenuItem>
  )
}

export function SidebarNavSkeleton() {
  return (
    <>
      <SidebarNavItemSkeleton />
      <SidebarNavItemSkeleton />
      <SidebarNavItemSkeleton />
    </>
  )
}

export default function SidebarNav({ username }: { username?: string }) {

  const { data: inbox, isLoading: isLoadingInbox, isFetching: isFetchingInbox } = useQuery({
    experimental_prefetchInRender: true,
    queryKey: ["attachments", "inbox"],
    queryFn: () => getInboxAttachments().then(data => data), // <-- serialize the data on the server
  })
  const { data: trash, isLoading: isLoadingTrash, isFetching: isFetchingTrash } = useQuery({
    experimental_prefetchInRender: true,
    queryKey: ["attachments", "trash"],
    queryFn: () => getTrashAttachments().then(data => data), // <-- serialize the data on the server
  })

  const inboxLoading = isLoadingInbox || isFetchingInbox;
  const trashLoading = isLoadingTrash || isFetchingTrash;

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
              {inboxLoading ? <Skeleton className="h-5 w-6" /> : (inbox || []).length}
            </SidebarMenuBadge>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/trash" />}>
              <Trash2Icon />
              <span>Корзина</span>
            </SidebarMenuButton>
            <SidebarMenuBadge>
              {trashLoading ? <Skeleton className="h-5 w-6" /> : (trash || []).length}
            </SidebarMenuBadge>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
