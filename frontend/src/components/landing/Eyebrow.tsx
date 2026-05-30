import { type ReactNode } from "react";

import { cn } from "@/lib/cn";

interface EyebrowProps {
  children: ReactNode;
  className?: string;
}

/**
 * Small rounded pill with a glowing brand dot. Used at the top of the hero
 * to set context ("AI 워싱 탐지 엔진 · v1.0").
 */
export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <span
      className={cn(
        "border-border bg-bg/80 text-fg-muted inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium tracking-tight shadow-[var(--shadow-card)] backdrop-blur",
        className,
      )}
    >
      <span
        aria-hidden
        className="bg-brand inline-block size-1.5 rounded-full shadow-[var(--shadow-glow-brand)]"
      />
      {children}
    </span>
  );
}
