"use client"
import { Button } from "@workspace/ui/components/button";
import { Kbd } from "@workspace/ui/components/kbd";
import { Separator } from "@workspace/ui/components/separator";
import { ListFilterIcon, PlusIcon, SearchIcon, SettingsIcon } from "lucide-react";
import CollectionSelect from "./collection-select";
import SidebarTrigger from "./sidebar-trigger";

type HeaderProps = {
  defaultCollection?: string
  children?: React.ReactNode
}
export default function Header({ children, defaultCollection }: HeaderProps) {


  return (
    <header className="h-14 bg-background/90 backdrop-blur-md sticky top-0 py-2 px-6 z-20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <CollectionSelect defaultCollection={defaultCollection} />
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
