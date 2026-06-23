"use client"
import { useGlobalStore } from "@/lib/stores/global-store";
import { useUser } from "@/lib/stores/user";
import { Button } from "@workspace/ui/components/button";
import { Kbd } from "@workspace/ui/components/kbd";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Separator } from "@workspace/ui/components/separator";
import { ListFilterIcon, LockIcon, LockOpenIcon, PlusIcon, SearchIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import SidebarTrigger from "./sidebar-trigger";

type HeaderProps = {
  defaultCollection?: string
  children?: React.ReactNode
}
export default function Header({ children, defaultCollection }: HeaderProps) {
  const collections = useGlobalStore(state => state.collections)
  const user = useUser(state => state.user)

  const [collectionId, setCollectionId] = useState<string | null>(defaultCollection || null)

  const collection = collections.find(collection => collection.id === collectionId)

  return (
    <header className="h-14 bg-background/90 backdrop-blur-md sticky top-0 py-2 px-6 z-20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Select
          value={collectionId}
          onValueChange={state => setCollectionId(state)}
          defaultValue={defaultCollection}
          itemToStringLabel={item => {
            return collections.find(collection => collection.id === item)?.name || item
          }}
        >
          <SelectTrigger>
            {collection?.public ? <LockOpenIcon /> : <LockIcon />}
            <SelectValue placeholder="Коллекция" />
          </SelectTrigger>
          <SelectContent>
            {
              collections
                .map(collection => {
                  return (
                    <SelectItem
                      key={collection.id}
                      value={collection.id}
                      render={<Link href={`/${user?.username || ""}/${collection.id}`} />}
                    >
                      {collection?.public ? <LockOpenIcon /> : <LockIcon />}
                      <span>{collection.name}</span>
                    </SelectItem>
                  )
                })
            }
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon"><ListFilterIcon /></Button>
      </div>
      {children}
      <div className="flex items-center h-9 gap-2">
        <Button variant="outline">
          <SearchIcon />
          <span className="text-muted-foreground">Поиск</span>
          <Kbd>Ctrl+K</Kbd>
        </Button>
        <Separator orientation="vertical" />
        <Button variant="ghost" size="icon"><PlusIcon /></Button>
        <Button variant="ghost" size="icon"><SettingsIcon /></Button>
      </div>
    </header>
  )
}
