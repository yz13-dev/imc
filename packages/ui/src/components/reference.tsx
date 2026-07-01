import * as React from "react"
import { cn } from "../lib/utils"
import { Badge } from "./badge"
import { Button } from "./button"
// maybe not the best name

type ReferenceProps = {} & React.ComponentPropsWithoutRef<"figure">

function Reference({ className = "", children, style, ...props }: ReferenceProps) {

  return (
    <figure
      data-slot="reference"
      className={cn(
        "w-full group relative",
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </figure>
  )
}

type ReferenceContentProps = {} & React.ComponentPropsWithoutRef<"div">

function ReferenceContent({ className = "", children, ...props }: ReferenceContentProps) {

  return (
    <div
      eata-slot="reference-content"
      className={cn(
        "rounded-lg [&_img]:rounded-sm [&_video]:rounded-sm bg-muted relative size-full",
        "*:data-[slot=reference-attachment]:size-full *:data-[slot=reference-attachment]:object-cover *:data-[slot=reference-attachment]:object-top-left",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

type ReferenceOverlayProps = {} & React.ComponentPropsWithoutRef<"div">
function ReferenceOverlay({ id, className = "", ...props }: ReferenceOverlayProps) {
  return <div className={cn("absolute size-full inset-0", className)} data-id={id} {...props} />
}

type ReferenceFooterProps = {} & React.ComponentPropsWithoutRef<"div">
function ReferenceFooter({ className, children, ...props }: ReferenceFooterProps) {
  return (
    <div
      className={cn(
        "absolute bottom-2 left-0 px-2 z-10 w-full flex items-center justify-between *:w-1/2 gap-1",
        "*:first:justify-start *:last:justify-end",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

type ReferenceFooterGroupProps = {} & React.ComponentPropsWithoutRef<"div">
function ReferenceFooterGroup({ className, children, ...props }: ReferenceFooterProps) {
  return (
    <div
      data-slot="reference-footer-group"
      className={cn(
        "flex items-center gap-1",
        "*:data-[slot=avatar]:size-5 *:data-[slot=avatar]:rounded-full *:data-[slot=avatar]:overflow-clip *:data-[slot=avatar]:*:rounded-full *:data-[slot=avatar]:after:rounded-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

type ReferenceLabelProps = {} & React.ComponentPropsWithoutRef<typeof Badge>
function ReferenceLabel({ className = "", children, ...props }: ReferenceLabelProps) {
  return (
    <Badge
      data-slot="reference-label"
      render={<figcaption />}
      className={cn(
        "h-6 bg-foreground/50 tabular-nums border-foreground/25 text-background max-w-full line-clamp-1! backdrop-blur-3xl",
        className
      )}
      {...props}
    >
      {children}
    </Badge>
  )
}

type ReferenceBadgeProps = {} & React.ComponentPropsWithoutRef<typeof Badge>
function ReferenceBadge({ className = "", children, ...props }: ReferenceBadgeProps) {
  return (
    <Badge
      className={cn(
        "h-6 bg-foreground/50 tabular-nums border-foreground/25 text-background max-w-full line-clamp-1! backdrop-blur-3xl",
        className
      )}
      {...props}
    >
      {children}
    </Badge>
  )
}
type ReferenceButtonProps = {} & React.ComponentPropsWithoutRef<typeof Button>
function ReferenceButton({ size = "icon-xs", className = "", children, ...props }: ReferenceButtonProps) {
  return (
    <Button
      size={size}
      className={cn("bg-foreground/50 border-foreground/50 text-background backdrop-blur-md", className)}
      {...props}
    >
      {children}
    </Button>
  )
}

export {
  Reference, ReferenceBadge, ReferenceButton, ReferenceContent, ReferenceFooter, ReferenceFooterGroup, ReferenceLabel, ReferenceOverlay
}
export type {
  ReferenceBadgeProps, ReferenceButtonProps, ReferenceContentProps, ReferenceFooterGroupProps, ReferenceFooterProps, ReferenceLabelProps, ReferenceOverlayProps, ReferenceProps
}

