"use client"

import { signOut } from "@/lib/me"
import { useUser } from "@/lib/stores/user"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { ChevronDown, LogOutIcon } from "lucide-react"
import { useRouter } from "next/navigation"

export default function UserDropdown() {
  const user = useUser(state => state.user)
  const router = useRouter()

  const logOut = async () => {
    await signOut()
    router.refresh()
  }

  if (!user) return <Button>Войти</Button>
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="px-0 w-full">
            <Avatar>
              <AvatarImage src={user.image || undefined} alt={user.username || user.name || user.displayUsername || ""} />
              <AvatarFallback className="uppercase">{user.username?.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="text-lg md:inline hidden font-medium">{user.displayUsername || user.username || user.name || ""}</span>
            <ChevronDown className="ml-auto" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={logOut}>
          <LogOutIcon />
          <span>Выйти</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
