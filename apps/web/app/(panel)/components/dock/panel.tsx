"use client"
import { getCollections } from "@/lib/api/collections";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { InboxIcon, LayoutGridIcon, MenuIcon, PlusSquareIcon, SquareLibraryIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";



export default function Panel() {

  const { data } = useSuspenseQuery({
    queryKey: ["attachments", "collections"],
    queryFn: () => getCollections(),
  })

  return (
    <aside
      className={cn(
        "fixed left-0 right-0 bottom-6 z-20 mx-auto h-13 p-1 dark:bg-muted/50 bg-muted/80 backdrop-blur-xs rounded-xl w-fit border",
        "[&_button]:size-10.5 [&_button]:rounded-lg",
        "[&_a]:size-10.5 [&_a]:rounded-lg",
      )}
    >
      <Button size="icon" variant="default" nativeButton={false} render={<Link href="/inbox" />}>
        <InboxIcon className="size-5" />
      </Button>
      <Button size="icon" variant="ghost" nativeButton={false} render={<Link href="/new/card" />}>
        <PlusSquareIcon className="size-5" />
      </Button>
      <Button size="icon" variant="ghost" nativeButton={false} render={<Link href="/dashboard" />}>
        <SquareLibraryIcon className="size-5" />
      </Button>
      <Button size="icon" variant="ghost" nativeButton={false} render={<Link href="/dashboard" />}>
        <LayoutGridIcon className="size-5" />
      </Button>
      <Button size="icon" variant="ghost" nativeButton={false} render={<Link href="/trash" />}>
        <Trash2Icon className="size-5" />
      </Button>
      <Button size="icon" variant="ghost">
        <MenuIcon className="size-5" />
      </Button>
    </aside>
  )
}
