import { cva, type VariantProps } from "class-variance-authority";
import { type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const badgeStyles = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium tracking-tight whitespace-nowrap",
  {
    variants: {
      intent: {
        neutral: "bg-surface text-fg-muted border border-border",
        brand: "bg-brand-soft text-brand-fg",
        accent: "bg-accent-soft text-accent-fg",
        warm: "bg-warm-soft text-warm-fg",
        ok: "bg-ok-soft text-ok",
        warn: "bg-warn-soft text-warn",
        danger: "bg-danger-soft text-danger",
        /** Dimension intents — KPI / section labels */
        washing: "bg-missing-soft text-[color:var(--color-dim-washing)]",
        verify: "bg-verified-soft text-[color:var(--color-dim-verify)]",
        relational: "bg-accent-soft text-[color:var(--color-dim-relational)]",
      },
    },
    defaultVariants: {
      intent: "neutral",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeStyles> {}

export function Badge({ className, intent, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeStyles({ intent, className }))} {...props} />
  );
}
