"use client"
import { useGlobalStore } from "@/lib/global-store";
import { Button } from "@workspace/ui/components/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@workspace/ui/components/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { ListFilterIcon, PlusIcon, SearchIcon } from "lucide-react";
import SidebarTrigger from "./sidebar-trigger";

type HeaderProps = {
  defaultCollection?: string
  children?: React.ReactNode
}
export default function Header({ children, defaultCollection }: HeaderProps) {
  const collections = useGlobalStore(state => state.collections)
  return (
    <header className="h-14 bg-background/90 backdrop-blur-md sticky top-0 py-2 px-6 z-20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Select
          defaultValue={defaultCollection}
          itemToStringLabel={item => {
            return collections.find(collection => collection.id === item)?.name || item
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Коллекция" />
          </SelectTrigger>
          <SelectContent>
            {
              collections
                .map(collection => {
                  return (
                    <SelectItem key={collection.id} value={collection.id}>{collection.name}</SelectItem>
                  )
                })
            }
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon"><ListFilterIcon /></Button>
      </div>
      {children}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon"><PlusIcon /></Button>
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput placeholder="Поиск..." />
        </InputGroup>
      </div>
    </header>
  )
}
