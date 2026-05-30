"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/cn";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        /** Primary CTA — solid dark. Used for main actions (Analyze, New analysis). */
        primary:
          "bg-fg text-fg-on-brand shadow-sm hover:bg-fg-muted focus-visible:ring-fg",
        /** Branded gradient CTA — the only gradient button allowed. */
        cta: "text-fg-on-brand shadow-sm hover:opacity-95 focus-visible:ring-brand [background:var(--gradient-cta)]",
        /** Secondary outline — subtle border, used for less-emphasized actions. */
        secondary:
          "bg-bg text-fg border border-border shadow-sm hover:bg-surface focus-visible:ring-border-strong",
        /** Brand-tinted solid — rarely used (e.g. KPI accent). */
        brand:
          "bg-brand text-fg-on-brand shadow-sm hover:bg-brand-fg focus-visible:ring-brand",
        /** Ghost — toolbar/nav back links. */
        ghost:
          "text-fg-muted hover:text-fg hover:bg-surface focus-visible:ring-border",
        /** Link — text-only inline buttons. */
        link: "text-fg-muted underline-offset-4 hover:underline focus-visible:ring-border",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        /** Matches input h-12 — use when sitting next to an `<input>`. */
        lg: "h-12 px-5 text-sm",
        xl: "h-14 px-7 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonStyles({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
