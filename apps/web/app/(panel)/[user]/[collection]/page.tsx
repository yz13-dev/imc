
import { Button } from "@workspace/ui/components/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@workspace/ui/components/input-group"
import { ImcIcon } from "@workspace/ui/components/logo/imc"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { ListFilterIcon, PlusIcon, SearchIcon, SidebarIcon } from "lucide-react"
import Link from "next/link"
import CollectionCard from "./components/collection-card"


type PageProps = {
  params: Promise<{
    user: string
    collection: string
  }>
  searchParams: Promise<{
    id: string
  }>
}
export default async function Page({ params, searchParams }: PageProps) {
  const { user, collection } = await params
  const { id } = await searchParams

  const collections = [
    {
      id: "demo-1",
      src: "/demo/demo-1.jpg",
      title: "Карточка коллекции 1",
    },
    {
      id: "demo-2",
      src: "/demo/demo-2.jpg",
      title: "Карточка коллекции 2",
    },
    {
      id: "demo-3",
      src: "/demo/demo-3.jpg",
      title: "Карточка коллекции 3",
    },
    {
      id: "demo-4",
      src: "/demo/demo-4.jpg",
      title: "Карточка коллекции 4",
    },
    {
      id: "demo-5",
      src: "/demo/demo-5.jpg",
      title: "Карточка коллекции 5",
    },
    {
      id: "demo-6",
      src: "/demo/demo-6.jpg",
      title: "Карточка коллекции 6",
    },
    {
      id: "demo-7",
      src: "/demo/demo-7.jpg",
      title: "Карточка коллекции 7",
    },
    {
      id: "demo-8",
      src: "/demo/demo-8.jpg",
      title: "Карточка коллекции 8",
    },
    {
      id: "demo-9",
      src: "/demo/demo-9.jpg",
      title: "Карточка коллекции 9",
    },
    {
      id: "demo-10",
      src: "/demo/demo-10.jpg",
      title: "Карточка коллекции 10",
    },
    {
      id: "demo-11",
      src: "/demo/demo-11.gif",
      title: "Карточка коллекции 11",
    },
    {
      id: "demo-12",
      src: "/demo/demo-12.mp4",
      title: "Карточка коллекции 12",
    },
    {
      id: "demo-13",
      src: "/demo/demo-13.png",
      title: "Карточка коллекции 13",
    },
  ]

  const scope = `${user}/${collection}`
  return (
    <>
      <header className="h-12 bg-background/60 backdrop-blur-md sticky top-0 py-2 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon"><SidebarIcon /></Button>
          <Link href="/">
            <ImcIcon className="size-6" />
          </Link>
          <span className="text-muted-foreground">/</span>
          <Select
            defaultValue={collection}
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
      {
        id &&
        <div className="absolute inset-0 w-full min-h-svh bg-background z-50"></div>
      }
      <div className="w-full px-6 pt-6">
        <div
          className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 space-y-4"
        >

          {
            collections.map((item) => {
              return (
                <CollectionCard
                  key={item.id}
                  id={item.id}
                  src={item.src}
                  title={item.title}
                  scope={scope}
                />
              )
            })
          }

        </div>
      </div>
      <footer className="p-6">

      </footer>
    </>
  )
}
