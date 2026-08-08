"use client"
import { getCollections } from "@/lib/api/collections";
import { useUser } from "@/lib/stores/user";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { InboxIcon, MenuIcon, PlusSquareIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import CollectionsGroup from "./groups/collections";


export default function Panel() {

  const user = useUser(state => state.user)
  const { data } = useSuspenseQuery({
    queryKey: ["attachments", "collections"],
    queryFn: () => getCollections(),
  })

  const userId = user?.username || user?.id

  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-20 mx-auto sm:bottom-6 bottom-3",
        "w-fit px-2",
      )}
    >
      <aside
        className={cn(
          "h-fit flex items-center p-1 dark:bg-muted/50 bg-muted/80 backdrop-blur-xs sm:rounded-xl rounded-2xl border",
          "sm:[&_button]:size-10.5 [&_button]:size-16 sm:[&_button]:rounded-lg [&_button]:rounded-2xl",
          "sm:[&_a]:size-10.5 [&_a]:size-16 sm:[&_a]:rounded-lg [&_a]:rounded-2xl",
        )}
      >
        <Tooltip>
          <TooltipTrigger render={
            <Button size="icon" variant="default" nativeButton={false} render={<Link href="/new/card" />}>
              <PlusSquareIcon className="sm:size-5 size-8" />
            </Button>
          }
          />
          <TooltipContent>Новая карточка</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger render={
            <Button size="icon" variant="ghost" nativeButton={false} render={<Link href="/inbox" />}>
              <InboxIcon className="sm:size-5 size-8" />
            </Button>
          }
          />
          <TooltipContent>Входящие</TooltipContent>
        </Tooltip>
        {
          userId &&
          <CollectionsGroup userId={userId} data={data || []} />
        }
        <Tooltip>
          <TooltipTrigger render={
            <Button size="icon" variant="ghost" nativeButton={false} render={<Link href="/trash" />}>
              <Trash2Icon className="sm:size-5 size-8" />
            </Button>
          }
          />
          <TooltipContent>Корзина</TooltipContent>
        </Tooltip>
        <Button size="icon" variant="ghost">
          <MenuIcon className="sm:size-5 size-8" />
        </Button>
      </aside>
    </div>
  )
}
