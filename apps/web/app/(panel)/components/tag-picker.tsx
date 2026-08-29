import { cn } from "@workspace/ui/lib/utils";



export default function TagPicker({ children, className = "" }: { children?: React.ReactNode, className?: string }) {
  return (
    <nav className={cn("py-2 z-20 px-6 h-14 w-full overflow-x-auto", className)}>
      {children}
    </nav>
  );
}
