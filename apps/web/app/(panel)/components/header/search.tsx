
import { Button } from "@workspace/ui/components/button"
import { Kbd } from "@workspace/ui/components/kbd"
import { SearchIcon } from "lucide-react"

export default function Search() {
  return (
    <Button variant="outline">
      <SearchIcon />
      <span className="text-muted-foreground">Поиск</span>
      <Kbd>Ctrl+K</Kbd>
    </Button>
  )
}
