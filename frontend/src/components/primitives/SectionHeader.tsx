import { type ReactNode } from "react";

import { cn } from "@/lib/cn";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  count?: number;
  aside?: ReactNode;
  className?: string;
}

/**
 * Standard header for cards/sections — small uppercase mono "eyebrow" label,
 * bold title with optional count, and an optional right-side description.
 * Lives on a 1px bottom divider that matches the card body padding.
 */
export function SectionHeader({
  eyebrow,
  title,
  count,
  aside,
  className,
}: SectionHeaderProps) {
  return (
    <header
      className={cn(
        "border-border flex flex-col gap-1 border-b px-5 pt-5 pb-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <span className="mono-eyebrow">{eyebrow}</span>
        <h2 className="text-fg flex items-baseline gap-2 text-base font-bold tracking-tight">
          <span>{title}</span>
          {count != null ? (
            <span className="text-fg-dim font-mono text-[13px] font-medium">
              {count}
            </span>
          ) : null}
        </h2>
      </div>
      {aside ? (
        <div className="text-fg-subtle text-[13px]">{aside}</div>
      ) : null}
    </header>
  );
}
