import { cn } from "@/lib/cn";

interface ImpactBarProps {
  /** Signed impact (-100..+100). Direction determines colour. */
  value: number;
  className?: string;
}

/**
 * Compact 0–50% horizontal bar for an XAI finding's impact magnitude.
 * Bar grows from the centre — risk-increasing findings push right (red),
 * risk-decreasing findings push left (green-teal).
 */
export function ImpactBar({ value, className }: ImpactBarProps) {
  const magnitude = Math.min(50, Math.max(0, Math.abs(value)));
  const widthPct = (magnitude / 50) * 50; // 0 → 0%, 50 → 50% of the track
  const isUp = value >= 0;

  return (
    <div
      className={cn(
        "bg-surface-strong relative h-1 w-full max-w-[240px] overflow-hidden rounded-full",
        className,
      )}
      aria-hidden
    >
      <span className="bg-border absolute left-1/2 top-0 h-full w-px -translate-x-1/2" />
      <div
        className={cn(
          "absolute top-0 h-full rounded-full transition-all duration-500 ease-out",
          isUp ? "bg-danger left-1/2" : "bg-ok right-1/2",
        )}
        style={{ width: `${widthPct}%` }}
      />
    </div>
  );
}
