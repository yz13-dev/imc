import { cn } from "@workspace/ui/lib/utils"

type HeaderProps = React.ComponentPropsWithoutRef<"header">
type HeaderContentProps = React.ComponentPropsWithoutRef<"div">


export function HeaderContent({ children, className, ...props }: HeaderContentProps) {
  return (
    <div className={cn("flex items-center h-9 gap-2", className)} {...props}>
      {children}
    </div>
  )
}

export default function Header({ children, className, ...props }: HeaderProps) {


  return (
    <header
      className={cn(
        "h-14 bg-background/90 backdrop-blur-md sticky top-0 py-2 px-6 z-20 flex items-center justify-between",
        className
      )}
      {...props}
    >
      {children}
    </header>
  )
}
