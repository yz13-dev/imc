import { cn } from "@workspace/ui/lib/utils"
import { motion, type HTMLMotionProps } from "motion/react"

export type OverlayProps = HTMLMotionProps<"div">



export default function Overlay({ className = "", children, onClick, ...props }: OverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      className={cn("fixed inset-0 w-full h-svh z-50 py-6 flex flex-col items-center justify-end bg-black/10", className)}
      onClick={e => {
        e.stopPropagation()
        if (onClick) onClick(e)
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
