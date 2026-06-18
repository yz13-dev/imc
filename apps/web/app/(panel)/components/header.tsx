import { Button } from "@workspace/ui/components/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@workspace/ui/components/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { ListFilterIcon, PlusIcon, SearchIcon } from "lucide-react";
import SidebarTrigger from "./sidebar-trigger";




export default function Header() {
  return (
    <header className="h-14 bg-background/60 backdrop-blur-md sticky top-0 py-2 px-6 flex items-center justify-between">
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
      <div className="w-full px-4 flex items-center gap-2">
        <Button variant="outline">
          <span>Website</span>
          <span className="text-muted-foreground">0</span>
        </Button>
        <Button variant="outline">
          <span>UI</span>
          <span className="text-muted-foreground">0</span>
        </Button>
      </div>
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
