import { cn } from "@workspace/ui/lib/utils"

export type OverlayProps = React.ComponentPropsWithoutRef<"div">



export default function Overlay({ className = "", children, onClick, ...props }: OverlayProps) {
  return (
    <div
      className={cn("fixed inset-0 w-full h-svh z-50 py-6 backdrop-blur-sm flex items-end justify-center bg-black/10", className)}
      onClick={e => {
        e.stopPropagation()
        if (onClick) onClick(e)
      }}
      {...props}
    >
      {children}
    </div>
  )
}
