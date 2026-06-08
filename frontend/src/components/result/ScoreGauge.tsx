import { Badge } from "@/components/primitives/Badge";
import { scoreTier } from "@/lib/score";
import type { OverallLabel } from "@/types/analysis";

interface ScoreGaugeProps {
  value: number;
  label: OverallLabel;
  /** When `compact`, the gauge stacks vertically with smaller text. */
  variant?: "default" | "compact";
}

const TIER_BADGE_INTENT = {
  ok: "ok" as const,
  warn: "warn" as const,
  danger: "danger" as const,
};

/**
 * The headline "60 / 100" gauge. The number is always drawn with the brand
 * triad gradient (`.score-gauge-num`); the tier-aware colour is reserved for
 * the smaller label badge underneath.
 */
export function ScoreGauge({ value, label, variant = "default" }: ScoreGaugeProps) {
  const tier = scoreTier(value);
  const numClass =
    variant === "compact"
      ? "text-5xl"
      : "text-6xl md:text-7xl";

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="text-fg-subtle text-[13px] font-semibold uppercase tracking-wider">ACCS 신뢰도</p>
      <p className={`score-gauge-num ${numClass} tabular-nums`}>
        {Number.isInteger(value) ? value : value.toFixed(2)}
        <span className="text-fg-dim ml-1 text-lg font-bold">/100</span>
      </p>
      <Badge intent={TIER_BADGE_INTENT[tier]}>
        <span className="font-semibold">{label}</span>
      </Badge>
    </div>
  );
}
