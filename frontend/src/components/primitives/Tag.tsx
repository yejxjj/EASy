import { type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/** A neutral pill used for product attributes (e.g. "AI 기능 주장"). */
export function Tag({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "border-border text-fg-muted inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs",
        className,
      )}
      {...props}
    />
  );
}
