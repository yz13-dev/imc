"use client"
import type { Collection } from "@/types/collections";
import { collectionPath } from "@/lib/routes";
import { Button } from "@workspace/ui/components/button";
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@workspace/ui/components/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { LayoutGridIcon, LibrarySquareIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import Group from "../group";
import { useDockPanel } from "../panel-context";
import NewCollectionMenu from "../panels/new-collection-menu";


type CollectionsGroupProps = {
  data: Collection[]
}

export default function CollectionsGroup({ data }: CollectionsGroupProps) {
  const segments = useSelectedLayoutSegments()
  const { toggle } = useDockPanel()

  const collectionId = segments[1]

  const Collections = () => {
    return (
      <>
        <DropdownMenuItem nativeButton={false} render={<Link href="/dashboard" />}>
          <LayoutGridIcon />
          <span>Доска</span>
        </DropdownMenuItem>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Коллекции</DropdownMenuLabel>
          {
            (data || []).map(item => {
              return <DropdownMenuItem key={item.id} nativeButton={false} render={<Link href={collectionPath(item.id)} />}>
                <LibrarySquareIcon />
                {item.name}
              </DropdownMenuItem>
            })
          }
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => toggle("new-collection", <NewCollectionMenu />)}>
          <PlusIcon />
          <span>Новая коллекция</span>
        </DropdownMenuItem>
      </>
    )
  }

  const collection = (data || []).find(item => item.id === collectionId)

  return (
    <>
      <Group group={<Collections />}>
        {
          collection
            ?
            <Tooltip>
              <TooltipTrigger render={
                <Button size="icon" variant="ghost" nativeButton={false} render={<Link href={collectionPath(collection.id)} />}>
                  <LibrarySquareIcon className="size-5" />
                </Button>
              }
              />
              <TooltipContent>{collection.name}</TooltipContent>
            </Tooltip>
            :
            <Tooltip>
              <TooltipTrigger render={
                <Button size="icon" variant="ghost" nativeButton={false} render={<Link href="/dashboard" />}>
                  <LayoutGridIcon className="size-5" />
                </Button>
              }
              />
              <TooltipContent>Доска</TooltipContent>
            </Tooltip>
        }
      </Group>
    </>
  )
}
