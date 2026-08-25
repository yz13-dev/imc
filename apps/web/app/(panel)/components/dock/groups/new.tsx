"use client"
import { Button } from "@workspace/ui/components/button";
import { DropdownMenuItem } from "@workspace/ui/components/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { ImagePlusIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import Group from "../group";
import { useDockPanel } from "../panel-context";
import NewAttachmentPanel from "../panels/new-attachment";
import NewCollectionMenu from "../panels/new-collection-menu";


type NewGroupProps = {
}

export default function NewGroup({ }: NewGroupProps) {
  const { toggle } = useDockPanel()

  const ActionsGroup = () => {
    return (
      <>
        <DropdownMenuItem nativeButton={false} render={<Link href="/dashboard" />}>
          <PlusIcon />
          <span>Новая карточка</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggle("new-collection", <NewCollectionMenu />)}>
          <PlusIcon />
          <span>Новая коллекция</span>
        </DropdownMenuItem>
      </>
    )
  }

  return (
    <Group group={<ActionsGroup />}>
      <Tooltip>
        <TooltipTrigger render={
          <Button size="icon" variant="ghost" onClick={() => toggle("new-attachment", <NewAttachmentPanel />)}>
            <ImagePlusIcon className="size-5" />
          </Button>
        }
        />
        <TooltipContent>Вложение</TooltipContent>
      </Tooltip>
    </Group>
  )
}
