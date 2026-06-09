import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default:
          "bg-ink text-paper hover:bg-ink-soft shadow-[0_1px_0_rgba(0,0,0,0.05)]",
        clay:
          "bg-clay text-paper hover:bg-clay-dim shadow-[0_1px_0_rgba(0,0,0,0.05)]",
        outline:
          "border border-ink/15 bg-transparent text-ink hover:bg-paper-dim",
        ghost: "text-ink hover:bg-paper-dim",
        link: "text-clay underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 rounded",
        sm: "h-8 px-3 text-xs rounded-sm",
        lg: "h-12 px-7 text-base rounded",
        icon: "h-9 w-9 rounded",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
