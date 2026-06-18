import { Button } from "@workspace/ui/components/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@workspace/ui/components/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { ListFilterIcon, PlusIcon, SearchIcon } from "lucide-react";
import SidebarTrigger from "./sidebar-trigger";

export default function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="h-14 bg-background/90 backdrop-blur-md sticky top-0 py-2 px-6 z-20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Select
        >
          <SelectTrigger>
            <SelectValue placeholder="Коллекция" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="web">Веб</SelectItem>
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
