import { ChevronDownIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../lib/utils";

type NativeSelectSize = "xs" | "sm" | "default" | "lg";

type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: NativeSelectSize;
};

function NativeSelect({ className, size = "default", ...props }: NativeSelectProps) {
  return (
    <div
      className={cn(
        "group/native-select relative w-fit has-[select:disabled]:opacity-50",
        className,
      )}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="native-select"
        data-size={size}
        className="h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-sm transition-colors outline-none select-none selection:bg-brand selection:text-brand-foreground placeholder:text-tertiary focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:border-error aria-invalid:ring-3 aria-invalid:ring-error/20 data-[size=xs]:h-6 data-[size=xs]:rounded-[min(var(--radius-md),10px)] data-[size=xs]:py-0.5 data-[size=xs]:pr-7 data-[size=xs]:pl-2 data-[size=xs]:text-caption data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),12px)] data-[size=sm]:py-0.5 data-[size=sm]:text-caption data-[size=lg]:h-9 data-[size=lg]:pr-9 data-[size=lg]:pl-3 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-error/50 dark:aria-invalid:ring-error/40"
        {...props}
      />
      <ChevronDownIcon
        className={cn(
          "pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-tertiary select-none group-data-[size=xs]/native-select:right-2 group-data-[size=xs]/native-select:size-3 group-data-[size=sm]/native-select:size-3.5 group-data-[size=lg]/native-select:right-3",
        )}
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  );
}

function NativeSelectOption({ className, ...props }: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  );
}

function NativeSelectOptGroup({ className, ...props }: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  );
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
export type { NativeSelectProps, NativeSelectSize };
