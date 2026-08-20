"use client";

import { OTPInput, OTPInputContext } from "input-otp";
import { MinusIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../lib/utils";

type InputOTPSize = "xs" | "sm" | "default" | "lg";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

type InputOTPProps = DistributiveOmit<React.ComponentProps<typeof OTPInput>, "size"> & {
  size?: InputOTPSize;
};

const InputOTPSizeContext = React.createContext<InputOTPSize>("default");

function InputOTP({ className, containerClassName, size = "default", ...props }: InputOTPProps) {
  const resolvedSize = size ?? "default";

  return (
    <InputOTPSizeContext.Provider value={resolvedSize}>
      <OTPInput
        data-slot="input-otp"
        data-size={resolvedSize}
        containerClassName={cn(
          "cn-input-otp flex items-center has-disabled:opacity-50",
          containerClassName,
        )}
        spellCheck={false}
        className={cn("disabled:cursor-not-allowed", className)}
        {...props}
      />
    </InputOTPSizeContext.Provider>
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  const size = React.useContext(InputOTPSizeContext);

  return (
    <div
      data-slot="input-otp-group"
      data-size={size}
      className={cn(
        "flex items-center rounded-lg has-aria-invalid:border-error has-aria-invalid:ring-3 has-aria-invalid:ring-error/20 data-[size=xs]:rounded-[min(var(--radius-md),10px)] data-[size=sm]:rounded-[min(var(--radius-md),12px)] dark:has-aria-invalid:ring-error/40",
        className,
      )}
      {...props}
    />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number;
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const size = React.useContext(InputOTPSizeContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-size={size}
      data-active={isActive}
      className={cn(
        "relative flex size-8 items-center justify-center border-y border-r border-input text-sm transition-all outline-none first:rounded-l-lg first:border-l last:rounded-r-lg aria-invalid:border-error data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-3 data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:border-error data-[active=true]:aria-invalid:ring-error/20 data-[size=xs]:size-6 data-[size=xs]:text-caption data-[size=xs]:first:rounded-l-[min(var(--radius-md),10px)] data-[size=xs]:last:rounded-r-[min(var(--radius-md),10px)] data-[size=sm]:size-7 data-[size=sm]:text-caption data-[size=sm]:first:rounded-l-[min(var(--radius-md),12px)] data-[size=sm]:last:rounded-r-[min(var(--radius-md),12px)] data-[size=lg]:size-9 dark:bg-input/30 dark:data-[active=true]:aria-invalid:ring-error/40",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-primary duration-1000" />
        </div>
      )}
    </div>
  );
}

function InputOTPSeparator({ className, ...props }: React.ComponentProps<"div">) {
  const size = React.useContext(InputOTPSizeContext);

  return (
    <div
      data-slot="input-otp-separator"
      data-size={size}
      className={cn(
        "flex items-center [&_svg:not([class*='size-'])]:size-4 data-[size=xs]:[&_svg:not([class*='size-'])]:size-3 data-[size=sm]:[&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      role="separator"
      {...props}
    >
      <MinusIcon />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
export type { InputOTPSize };
