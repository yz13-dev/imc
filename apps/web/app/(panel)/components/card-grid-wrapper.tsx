import { cn } from "@workspace/ui/lib/utils";

export type CardGridWrapperProps = {
  className?: string;
  children?: React.ReactNode;
}

export default function CardGridWrapper({ className, children }: CardGridWrapperProps) {
  return (
    <div className="@container">
      <div
        className={cn("@7xl:columns-6 @6xl:columns-5 @5xl:columns-5 @4xl:columns-4 @xl:columns-3 @lg:columns-2 @sm:columns-1 space-y-2 gap-x-2", className)}
      >
        {children}
      </div>
    </div>
  );
}
