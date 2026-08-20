import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../lib/utils";

const textareaVariants = cva(
  "flex field-sizing-content w-full rounded-lg border border-input bg-transparent transition-colors outline-none placeholder:text-tertiary focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-error aria-invalid:ring-3 aria-invalid:ring-error/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-error/50 dark:aria-invalid:ring-error/40",
  {
    variants: {
      size: {
        xs: "min-h-12 rounded-[min(var(--radius-md),10px)] px-2 py-1.5 text-caption md:text-caption",
        sm: "min-h-14 rounded-[min(var(--radius-md),12px)] px-2.5 py-1.5 text-caption md:text-caption",
        default: "min-h-16 px-2.5 py-2 text-base md:text-sm",
        lg: "min-h-20 px-3 py-2.5 text-base md:text-sm",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

type TextareaProps = React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>;

function Textarea({ className, size = "default", ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      data-size={size}
      className={cn(textareaVariants({ size }), className)}
      {...props}
    />
  );
}

export { Textarea, textareaVariants };
export type { TextareaProps };
