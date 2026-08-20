import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../lib/utils";

const inputVariants = cva(
  "w-full min-w-0 rounded-lg border border-input bg-transparent transition-colors outline-none file:inline-flex file:border-0 file:bg-transparent file:font-medium file:text-primary placeholder:text-tertiary focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-error aria-invalid:ring-3 aria-invalid:ring-error/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-error/50 dark:aria-invalid:ring-error/40",
  {
    variants: {
      size: {
        xs: "h-6 rounded-[min(var(--radius-md),10px)] px-2 py-0.5 text-caption file:h-4 file:text-caption md:text-caption",
        sm: "h-7 rounded-[min(var(--radius-md),12px)] px-2.5 py-0.5 text-caption file:h-5 file:text-caption md:text-caption",
        default: "h-8 px-2.5 py-1 text-base file:h-6 file:text-sm md:text-sm",
        lg: "h-9 px-3 py-1.5 text-base file:h-7 file:text-sm md:text-sm",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

type InputProps = Omit<React.ComponentProps<"input">, "size"> & VariantProps<typeof inputVariants>;

type InputSize = NonNullable<InputProps["size"]>;

function Input({ className, type, size = "default", ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  );
}

export { Input, inputVariants };
export type { InputProps, InputSize };
