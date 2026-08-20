import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border border-transparent px-1 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-error aria-invalid:ring-error/20 dark:aria-invalid:ring-error/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-brand text-brand-foreground [a]:hover:bg-brand/80",
        secondary: "bg-surface-raised text-primary [a]:hover:bg-muted",
        error:
          "bg-error/10 text-error focus-visible:ring-error/20 dark:bg-error/20 dark:focus-visible:ring-error/40 [a]:hover:bg-error/20",
        success:
          "bg-success/10 text-success focus-visible:ring-success/20 dark:bg-success/20 dark:focus-visible:ring-success/40 [a]:hover:bg-success/20",
        warning:
          "bg-warning/10 text-warning focus-visible:ring-warning/20 dark:bg-warning/20 dark:focus-visible:ring-warning/40 [a]:hover:bg-warning/20",
        info: "bg-info/10 text-info focus-visible:ring-info/20 dark:bg-info/20 dark:focus-visible:ring-info/40 [a]:hover:bg-info/20",
        outline: "border-border text-primary [a]:hover:bg-muted [a]:hover:text-tertiary",
        ghost: "hover:bg-muted hover:text-tertiary dark:hover:bg-muted/50",
        link: "text-link underline-offset-4 hover:underline",
      },
      filled: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "error",
        filled: true,
        className: "bg-error text-error-foreground dark:bg-error [a]:hover:bg-error/90",
      },
      {
        variant: "success",
        filled: true,
        className: "bg-success text-success-foreground dark:bg-success [a]:hover:bg-success/90",
      },
      {
        variant: "warning",
        filled: true,
        className: "bg-warning text-warning-foreground dark:bg-warning [a]:hover:bg-warning/90",
      },
      {
        variant: "info",
        filled: true,
        className: "bg-info text-info-foreground dark:bg-info [a]:hover:bg-info/90",
      },
    ],
    defaultVariants: {
      variant: "default",
      filled: false,
    },
  },
);

function Badge({
  className,
  variant = "default",
  filled = false,
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, filled }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
      filled,
    },
  });
}

export { Badge, badgeVariants };
