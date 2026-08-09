"use client"

import { useUser } from "@/lib/stores/user"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { ChevronDown, LogOutIcon } from "lucide-react"

export default function UserDropdown() {
  const user = useUser(state => state.user)
  if (!user) return <Button>Войти</Button>
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="pl-0 w-full">
            <Avatar>
              <AvatarImage src={user.image || undefined} alt={user.username || user.name || user.displayUsername || ""} />
              <AvatarFallback className="uppercase">{user.username?.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="text-lg font-medium">{user.displayUsername || user.username || user.name || ""}</span>
            <ChevronDown className="ml-auto" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <LogOutIcon />
          <span>Выйти</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
