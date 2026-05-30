import { cn } from "@/lib/cn";
import { dimensionFillClass, type Dimension } from "@/lib/score";
import { scoreTier, tierStyles } from "@/lib/score";

interface ScoreBarProps {
  value: number;
  /**
   * When set, the bar fill uses the dimension colour (matching the KPI
   * card strap). When omitted, falls back to the tier-based colour.
   */
  dimension?: Dimension;
  className?: string;
  trackClassName?: string;
}

export function ScoreBar({
  value,
  dimension,
  className,
  trackClassName,
}: ScoreBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const fillClass = dimension
    ? dimensionFillClass(dimension)
    : tierStyles[scoreTier(value)].bar;

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "bg-surface-strong h-1.5 w-full overflow-hidden rounded-full",
        trackClassName,
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500 ease-out", fillClass)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
