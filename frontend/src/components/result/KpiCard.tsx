import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { Card, CardBody } from "@/components/primitives/Card";
import { ScoreBar } from "@/components/primitives/ScoreBar";
import { cn } from "@/lib/cn";
import { dimensionLabel, kpiBaselineCaption, type Dimension } from "@/lib/score";

interface KpiCardProps {
  dimension: Dimension;
  value: number;
  hint: string;
  isOverall?: boolean;
}

/**
 * One KPI tile in the result dashboard. The strap colour and bar fill both
 * come from the dimension, so the four cards share a colour family per axis
 * (washing/text orange-red, verify amber, relational teal). Overall uses
 * the gradient-text gauge number to stand apart.
 */
export function KpiCard({ dimension, value, hint, isOverall = false }: KpiCardProps) {
  const baseline = kpiBaselineCaption(value);
  const delta = value - 50;
  const Arrow = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
  const deltaColor =
    delta > 0 ? "text-danger" : delta < 0 ? "text-ok" : "text-fg-dim";

  return (
    <Card strapColor={dimension}>
      <CardBody className="flex flex-col gap-3 pt-4">
        <div className="flex items-center justify-between">
          <p className="mono-eyebrow">{dimensionLabel(dimension)}</p>
          {isOverall ? (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-tight text-white"
              style={{ background: "var(--gradient-cta)" }}
            >
              OVERALL
            </span>
          ) : null}
        </div>
        <p
          className={cn(
            "font-extrabold tracking-tight tabular-nums",
            isOverall
              ? "score-gauge-num text-5xl"
              : "text-fg text-4xl",
          )}
        >
          {value}
          <span className="text-fg-dim ml-1 text-sm font-medium">/100</span>
        </p>
        <ScoreBar value={value} dimension={dimension} />
        <div className="flex items-center justify-between gap-2 pt-1">
          <p className={cn("inline-flex items-center gap-1 text-xs font-medium", deltaColor)}>
            <Arrow size={12} aria-hidden />
            <span className="font-mono tabular-nums">{baseline}</span>
          </p>
        </div>
        <p className="text-fg-muted text-xs leading-relaxed">{hint}</p>
      </CardBody>
    </Card>
  );
}
