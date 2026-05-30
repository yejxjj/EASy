import { type HTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/cn";

export type StrapColor =
  | "washing"
  | "text"
  | "verify"
  | "relational"
  | "brand"
  | "accent"
  | "warm";

const STRAP_CLASSES: Record<StrapColor, string> = {
  washing: "bg-[color:var(--color-dim-washing)]",
  text: "bg-[color:var(--color-dim-text)]",
  verify: "bg-[color:var(--color-dim-verify)]",
  relational: "bg-[color:var(--color-dim-relational)]",
  brand: "bg-brand",
  accent: "bg-accent",
  warm: "bg-warm",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional 1px coloured strap at the top of the card (dimension indicator). */
  strapColor?: StrapColor;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, strapColor, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "border-border bg-bg relative overflow-hidden rounded-[var(--radius-card)] border shadow-[var(--shadow-card)]",
        className,
      )}
      {...props}
    >
      {strapColor ? (
        <span
          aria-hidden
          className={cn("absolute inset-x-0 top-0 h-[2px]", STRAP_CLASSES[strapColor])}
        />
      ) : null}
      {children}
    </div>
  ),
);
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1.5 px-5 pt-5 pb-2", className)}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-fg text-base font-semibold tracking-tight",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-fg-muted text-sm", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-5 pt-2 pb-5", className)} {...props} />
  ),
);
CardBody.displayName = "CardBody";

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "border-border flex items-center gap-2 border-t px-5 py-3",
        className,
      )}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";
