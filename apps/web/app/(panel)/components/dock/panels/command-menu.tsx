"use client"
import { getCollections } from "@/lib/api/collections"
import { useUser } from "@/lib/stores/user"
import { useHotkey } from "@tanstack/react-hotkeys"
import { useQuery } from "@tanstack/react-query"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@workspace/ui/components/command"
import { InboxIcon, LayoutDashboardIcon, LibrarySquareIcon, PlusIcon, PlusSquareIcon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useDockPanel } from "../panel-context"
import NewCollectionMenu from "./new-collection-menu"

export default function CommandMenu() {
  const router = useRouter()
  const { close, toggle } = useDockPanel()
  const user = useUser(state => state.user)
  const userId = user?.username || user?.id

  const { data: collections } = useQuery({
    queryKey: ["attachments", "collections"],
    queryFn: () => getCollections(),
  })

  const go = (href: string) => {
    router.push(href)
    close()
  }

  useHotkey("Escape", close)

  return (
    <Command className="dark:bg-muted/50 bg-muted/80 backdrop-blur-xs rounded-4xl border">
      <CommandInput autoFocus placeholder="Перейти..." />
      <CommandList>
        <CommandEmpty>Ничего не найдено</CommandEmpty>
        <CommandGroup heading="Навигация">
          <CommandItem onSelect={() => go("/dashboard")}>
            <LayoutDashboardIcon />
            <span>Доска</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/inbox")}>
            <InboxIcon />
            <span>Входящие</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/trash")}>
            <Trash2Icon />
            <span>Корзина</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/new/card")}>
            <PlusSquareIcon />
            <span>Новая карточка</span>
          </CommandItem>
        </CommandGroup>
        {
          userId &&
          <>
            <CommandSeparator />
            <CommandGroup heading="Коллекции">
              <CommandItem onSelect={() => toggle("new-collection", <NewCollectionMenu />)}>
                <PlusIcon />
                <span>Новая коллекция</span>
              </CommandItem>
              {
                (collections || []).map(collection => (
                  <CommandItem key={collection.id} onSelect={() => go(`/${userId}/${collection.id}`)}>
                    <LibrarySquareIcon />
                    <span>{collection.name}</span>
                  </CommandItem>
                ))
              }
            </CommandGroup>
          </>
        }
      </CommandList>
    </Command>
  )
}
