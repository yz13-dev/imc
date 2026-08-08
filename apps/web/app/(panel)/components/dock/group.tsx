import { Button } from "@workspace/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu";
import { ChevronDown } from "lucide-react";

type GroupProps = {
  children: React.ReactNode;
  group: React.ReactNode;
}
export default function Group({ children, group }: GroupProps) {
  return (
    <div className="flex items-center">
      {children}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" className="w-fit! group px-0">
              <ChevronDown className="size-4 group-aria-expanded:rotate-180 transition-transform will-change-transform" />
            </Button>
          }
        />
        <DropdownMenuContent>
          {group}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
