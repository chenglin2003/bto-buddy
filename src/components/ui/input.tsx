import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-11 w-full border border-ink/15 bg-paper px-4 py-2 text-sm",
        "placeholder:text-ink-faint focus-visible:outline-none focus-visible:border-clay focus-visible:ring-1 focus-visible:ring-clay/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "rounded",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
