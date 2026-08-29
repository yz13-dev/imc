"use client"
import { getCollections } from "@/lib/api/collections";
import { useUser } from "@/lib/stores/user";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { ArrowLeftIcon, InboxIcon, MenuIcon, Trash2Icon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import CollectionMenu from "./collection-menu";
import CollectionsGroup from "./groups/collections";
import GlobalDropZone from "./global-drop-zone";
import NewGroup from "./groups/new";
import { DockPanelProvider, useDockPanel } from "./panel-context";
import CommandMenu from "./panels/command-menu";


export default function Panel() {
  return (
    <DockPanelProvider>
      <GlobalDropZone />
      <PanelContent />
    </DockPanelProvider>
  )
}

function PanelContent() {

  const user = useUser(state => state.user)
  const { data } = useSuspenseQuery({
    queryKey: ["attachments", "collections"],
    queryFn: () => getCollections(),
  })

  const userId = user?.username || user?.id
  const pathname = usePathname()
  const router = useRouter()
  const pathSegments = pathname.split("/").filter(Boolean)
  const firstSegment = pathSegments[0]
  const isAttachmentPage = !!firstSegment && !["dashboard", "inbox", "trash", "new", "collection"].includes(firstSegment)
  const currentCollection = firstSegment === "collection"
    ? data?.find(collection => collection.id === pathSegments[1])
    : undefined
  const hasDynamicActions = isAttachmentPage || !!currentCollection

  const { panel, toggle } = useDockPanel()
  useHotkey("Mod+K", (event) => {
    event.preventDefault()
    toggle("command", <CommandMenu />)
  })

  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-20 mx-auto sm:bottom-6 bottom-3",
        "w-full px-2 flex flex-col items-center",
      )}
    >
      <AnimatePresence>
        {
          panel &&
          <>
            <motion.div
              key={panel.id}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="max-w-md w-full p-2"
            >
              {panel.content}
            </motion.div>
          </>
        }
      </AnimatePresence>
      <aside
        className={cn(
          "size-fit flex items-center p-1 dark:bg-muted/50 bg-muted/80 backdrop-blur-xs rounded-xl border",
          "[&_button]:size-10.5 [&_button]:rounded-lg",
          "[&_a]:size-10.5 [&_a]:rounded-lg",
        )}
      >
        {hasDynamicActions &&
          <>
            {isAttachmentPage && <Tooltip>
              <TooltipTrigger render={<Button size="icon" variant="ghost" onClick={() => router.back()} />}>
                <ArrowLeftIcon className="size-5" />
                <span className="sr-only">Назад</span>
              </TooltipTrigger>
              <TooltipContent>Назад</TooltipContent>
            </Tooltip>}
            {currentCollection && <CollectionMenu collectionId={currentCollection.id} title={currentCollection.name} public={currentCollection.public} />}
            <Separator orientation="vertical" className="mx-1 w-px h-8" />
          </>
        }
        {
          userId &&
          <NewGroup />
        }
        <Tooltip>
          <TooltipTrigger render={
            <Button size="icon" variant="ghost" nativeButton={false} render={<Link href="/inbox" />}>
              <InboxIcon className="size-5" />
            </Button>
          }
          />
          <TooltipContent>Входящие</TooltipContent>
        </Tooltip>
        {
          userId &&
          <CollectionsGroup data={data || []} />
        }
        <Tooltip>
          <TooltipTrigger render={
            <Button size="icon" variant="ghost" nativeButton={false} render={<Link href="/trash" />}>
              <Trash2Icon className="size-5" />
            </Button>
          }
          />
          <TooltipContent>Корзина</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={
            <Button
              size="icon"
              variant={panel?.id === "command" ? "default" : "ghost"}
              onClick={() => toggle("command", <CommandMenu />)}
            >
              <MenuIcon className="size-5" />
            </Button>
          }
          />
          <TooltipContent>Меню <span className="text-muted-foreground">⌘K</span></TooltipContent>
        </Tooltip>
      </aside>
    </div>
  )
}
