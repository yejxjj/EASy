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

export function KpiCard({ dimension, value, hint, isOverall = false }: KpiCardProps) {
  const baseline = kpiBaselineCaption(value);
  const delta = value - 50;
  const Arrow = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
  const deltaColor =
    delta > 0 ? "text-danger" : delta < 0 ? "text-ok" : "text-fg-dim";

  return (
    <Card strapColor={dimension}>
      <CardBody className="flex flex-col gap-3 pt-4">

        {/* 카드 레이블 */}
        <div className="flex items-center justify-between">
          <p className="text-fg-subtle text-[13px] font-semibold tracking-wide uppercase">
            {dimensionLabel(dimension)}
          </p>
          {isOverall ? (
            <span
              className="rounded-full px-2 py-0.5 text-[13px] font-semibold tracking-tight text-white"
              style={{ background: "var(--gradient-cta)" }}
            >
              OVERALL
            </span>
          ) : null}
        </div>

        {/* 점수 숫자 */}
        <p className={cn(
          "font-extrabold tracking-tight tabular-nums",
          isOverall ? "score-gauge-num text-5xl" : "text-fg text-4xl",
        )}>
          {value}
          <span className="text-fg-dim ml-1 text-base font-medium">/100</span>
        </p>

        <ScoreBar value={value} dimension={dimension} />

        {/* 기준선 대비 — 한글 포함이므로 sans 폰트 유지 */}
        <div className={cn("flex items-center gap-1 pt-0.5 text-[13px] font-medium", deltaColor)}>
          <Arrow size={14} aria-hidden />
          <span>{baseline}</span>
        </div>

        {/* 설명 힌트 */}
        <p className="text-fg-muted text-[13px] leading-relaxed">{hint}</p>

      </CardBody>
    </Card>
  );
}
