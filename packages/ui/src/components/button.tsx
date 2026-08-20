import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-error aria-invalid:ring-3 aria-invalid:ring-error/20 dark:aria-invalid:border-error/50 dark:aria-invalid:ring-error/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-linear-to-tl from-brand to-brand/80 text-brand-foreground border-none [a]:hover:bg-brand/80 gradient-border-1 gradient-border-to-tl gradient-border-from-brand/30 gradient-border-via-primary/20 gradient-border-to-brand/20",
        outline:
          "border-border bg-canvas hover:bg-muted hover:text-primary aria-expanded:bg-muted aria-expanded:text-primary dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary: "bg-surface-raised text-primary hover:bg-muted aria-expanded:bg-muted",
        ghost:
          "hover:bg-muted hover:text-primary aria-expanded:bg-muted aria-expanded:text-primary dark:hover:bg-muted/50",
        error:
          "bg-error/10 text-error hover:bg-error/20 focus-visible:border-error/40 focus-visible:ring-error/20 dark:bg-error/20 dark:hover:bg-error/30 dark:focus-visible:ring-error/40",
        success:
          "bg-success/10 text-success hover:bg-success/20 focus-visible:border-success/40 focus-visible:ring-success/20 dark:bg-success/20 dark:hover:bg-success/30 dark:focus-visible:ring-success/40",
        warning:
          "bg-warning/10 text-warning hover:bg-warning/20 focus-visible:border-warning/40 focus-visible:ring-warning/20 dark:bg-warning/20 dark:hover:bg-warning/30 dark:focus-visible:ring-warning/40",
        info: "bg-info/10 text-info hover:bg-info/20 focus-visible:border-info/40 focus-visible:ring-info/20 dark:bg-info/20 dark:hover:bg-info/30 dark:focus-visible:ring-info/40",
        link: "text-link underline-offset-4 hover:underline",
      },
      filled: {
        true: "",
        false: "",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-caption in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-caption in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    compoundVariants: [
      {
        variant: "error",
        filled: true,
        className:
          "bg-error text-error-foreground hover:bg-error/90 dark:bg-error dark:hover:bg-error/90",
      },
      {
        variant: "success",
        filled: true,
        className:
          "bg-success text-success-foreground hover:bg-success/90 dark:bg-success dark:hover:bg-success/90",
      },
      {
        variant: "warning",
        filled: true,
        className:
          "bg-warning text-warning-foreground hover:bg-warning/90 dark:bg-warning dark:hover:bg-warning/90",
      },
      {
        variant: "info",
        filled: true,
        className:
          "bg-info text-info-foreground hover:bg-info/90 dark:bg-info dark:hover:bg-info/90",
      },
    ],
    defaultVariants: {
      variant: "default",
      filled: false,
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  filled = false,
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-filled={filled || undefined}
      className={cn(buttonVariants({ variant, filled, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
