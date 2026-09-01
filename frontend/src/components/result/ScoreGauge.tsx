import { Badge } from "@/components/primitives/Badge";
import { tierForLabel } from "@/lib/score";
import type { OverallLabel } from "@/types/analysis";

interface ScoreGaugeProps {
  value: number;
  label: OverallLabel;
  /** When `compact`, the gauge stacks vertically with smaller text. */
  variant?: "default" | "compact";
}

/**
 * 머리 자리의 "31.4 / 100" 게이지.
 *
 * 숫자는 언제나 브랜드 그라데이션(`.score-gauge-num`)으로 그리고, 판정
 * 색은 아래 배지에만 쓴다.
 *
 * 두 가지를 고쳤다:
 *   · 배지 색을 점수로 다시 계산하지 않고 백엔드 라벨에서 가져온다.
 *     글자와 색이 다른 기준을 쓰면 "양호 구간"에 빨간 배지가 붙는다.
 *   · 소수 자릿수를 고정했다. 이전에는 정수면 그대로, 아니면 두 자리라
 *     같은 자리에서 `60` 과 `31.40` 이 번갈아 나왔다.
 */
export function ScoreGauge({ value, label, variant = "default" }: ScoreGaugeProps) {
  const tier = tierForLabel(label);
  const numClass = variant === "compact" ? "text-5xl" : "text-6xl md:text-7xl";

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="text-fg-subtle text-[13px] font-medium tracking-wider uppercase">
        ACCS 신뢰도
      </p>
      <p className={`score-gauge-num ${numClass} tabular-nums`}>
        {value.toFixed(1)}
        <span className="text-fg-dim ml-1 text-lg font-medium">/100</span>
      </p>
      <Badge intent={tier}>
        <span className="font-medium">{label}</span>
      </Badge>
    </div>
  );
}
