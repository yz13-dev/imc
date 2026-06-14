
import { Button } from "@workspace/ui/components/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@workspace/ui/components/input-group"
import { Select, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { ListFilterIcon, PlusIcon, SearchIcon, SidebarIcon } from "lucide-react"


export default function Page() {
  return (
    <>
      <header className="h-12 bg-background/60 backdrop-blur-md sticky top-0 py-2 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon"><SidebarIcon /></Button>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Коллекция" />
            </SelectTrigger>
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
      <div className="w-full px-6 pt-6">
        <div className="columns-1 sm:columns-2 lg:columns-3 2xl:columns-4 space-y-4">

          <div className="w-full break-inside-avoid">
            <div className="w-full aspect-square rounded-lg bg-muted" />
            <div className="pt-2 px-2">
              <span className="text-sm text-muted-foreground">Название</span>
            </div>
          </div>


        </div>
      </div>
      <footer className="p-6">

      </footer>
    </>
  )
}
