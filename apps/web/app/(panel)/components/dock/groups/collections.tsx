"use client"
import type { Collection } from "@/types/collections";
import { Button } from "@workspace/ui/components/button";
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel } from "@workspace/ui/components/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { LayoutGridIcon, LibrarySquareIcon } from "lucide-react";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import Group from "../group";


type CollectionsGroupProps = {
  userId: string
  data: Collection[]
}

export default function CollectionsGroup({ userId, data }: CollectionsGroupProps) {
  const segments = useSelectedLayoutSegments()

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
              return <DropdownMenuItem key={item.id} nativeButton={false} render={<Link href={`/${userId}/${item.id}`} />}>
                <LibrarySquareIcon />
                {item.name}
              </DropdownMenuItem>
            })
          }
        </DropdownMenuGroup>
      </>
    )
  }

  const collection = (data || []).find(item => item.id === collectionId)

  return (
    <Group group={<Collections />}>
      {
        collection
          ?
          <Tooltip>
            <TooltipTrigger render={
              <Button size="icon" variant="ghost" nativeButton={false} render={<Link href={`/${userId}/${collection.id}`} />}>
                <LibrarySquareIcon className="sm:size-5 size-8" />
              </Button>
            }
            />
            <TooltipContent>{collection.name}</TooltipContent>
          </Tooltip>
          :
          <Tooltip>
            <TooltipTrigger render={
              <Button size="icon" variant="ghost" nativeButton={false} render={<Link href="/dashboard" />}>
                <LayoutGridIcon className="sm:size-5 size-8" />
              </Button>
            }
            />
            <TooltipContent>Доска</TooltipContent>
          </Tooltip>
      }
    </Group>
  )
}
