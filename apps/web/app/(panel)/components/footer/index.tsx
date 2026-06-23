import { Button } from "@workspace/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu";
import { Kbd } from "@workspace/ui/components/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { ArrowUpIcon, ChevronDownIcon, SearchIcon, SettingsIcon } from "lucide-react";



export default function Footer() {
  return (
    <footer className="fixed bottom-8 left-0 right-0 z-20 mx-auto w-fit flex flex-col">
      <div className="w-fit h-fit mx-auto rounded-4xl bg-background/90 backdrop-blur-md ring-1 ring-border">
        <div
          className={cn(
            "group w-full flex items-center",
            "*:pl-3 has-data-[slot=group]:*:first:pl-1 has-data-[slot=separator]:*:first:pr-3 *:data-[slot=separator]:p-0 *:last:px-3 *:last:py-1 *:py-1",
            ""
          )}
        >

          <div data-slot="group" className="flex items-center">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="default" size="icon-lg" className="p-1">
                    <ArrowUpIcon className="size-4.5" />
                  </Button>
                }
              />
              <TooltipContent>
                <span>Скопировать почту</span>
                <Kbd>C</Kbd>
              </TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button size="icon-lg" variant="ghost" className="w-4">
                  <ChevronDownIcon className="group-aria-expanded/button:rotate-180 size-3 will-change-transform transition-transform" />
                </Button>
              } />
              <DropdownMenuContent align="start">
                <DropdownMenuItem>
                  <span>Коллекция</span>
                  <Kbd className="ml-auto">K</Kbd>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Референс</span>
                  <Kbd className="ml-auto">R</Kbd>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div data-slot="item">
            <Button variant="ghost" size="lg">
              <SearchIcon />
              <span className="text-muted-foreground">Поиск</span>
              <Kbd>Ctrl+K</Kbd>
            </Button>
          </div>
          <div data-slot="item">
            <Button variant="ghost" size="icon-lg" className="p-1">
              <SettingsIcon />
            </Button>
          </div>

        </div>
      </div>
    </footer>
  )
}
