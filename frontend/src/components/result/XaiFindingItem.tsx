import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { ImpactBar } from "@/components/result/ImpactBar";
import type { XaiFinding } from "@/types/analysis";

export function XaiFindingItem({ finding }: { finding: XaiFinding }) {
  const isRisk = finding.direction === "up";
  const sign = isRisk ? "+" : "";
  const impactClass = isRisk ? "text-danger" : "text-ok";
  const Arrow = isRisk ? ArrowUpRight : ArrowDownRight;

  return (
    <li className="flex gap-4 px-5 py-5">
      <span
        className="bg-surface-strong text-fg-subtle flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs"
        aria-hidden
      >
        {finding.rank.toString().padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-fg text-sm font-bold tracking-tight leading-snug">
            {finding.title}
          </p>
          <div
            className={`${impactClass} flex shrink-0 flex-col items-end gap-0.5`}
          >
            <span className="font-mono flex items-center gap-1 text-sm font-semibold">
              <Arrow size={14} aria-hidden />
              <span className="tabular-nums">
                {sign}
                {finding.impact_percent}%
              </span>
            </span>
            <span className="text-fg-dim text-[10px] font-medium uppercase tracking-[0.12em]">
              {isRisk ? "위험 증가" : "위험 감소"}
            </span>
          </div>
        </div>
        <p className="text-fg-muted mt-1 text-sm leading-relaxed">
          {finding.description}
        </p>
        <ImpactBar value={finding.impact_percent} className="mt-3" />
      </div>
    </li>
  );
}
