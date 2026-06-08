import { Check, Minus, X } from "lucide-react";

import { Card } from "@/components/primitives/Card";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { cn } from "@/lib/cn";
import { descriptionFor } from "@/lib/verificationDescriptions";
import type { VerificationIntent, VerificationResult } from "@/types/analysis";

const INTENT_ICON: Record<VerificationIntent, typeof Check> = {
  ok: Check,
  warn: X,
  neutral: Minus,
};

const INTENT_CLASSES: Record<VerificationIntent, { bg: string; text: string }> = {
  ok: { bg: "bg-ok-soft", text: "text-ok" },
  warn: { bg: "bg-warn-soft", text: "text-warn" },
  neutral: { bg: "bg-surface", text: "text-fg-muted" },
};

interface VerificationTableProps {
  verification: VerificationResult;
}

export function VerificationTable({ verification }: VerificationTableProps) {
  return (
    <Card>
      <SectionHeader
        eyebrow="verification"
        title="인증 · 등록 현황"
        count={verification.rows.length}
        aside={<span>공공 데이터베이스 교차 결과</span>}
      />
      <ul className="divide-soft px-5">
        {verification.rows.map((row) => {
          const Icon = INTENT_ICON[row.intent];
          const styles = INTENT_CLASSES[row.intent];
          const desc = descriptionFor(row.key);
          return (
            <li key={row.key} className="flex gap-4 py-4">
              <span
                className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                  styles.bg,
                )}
                aria-hidden
              >
                <Icon size={14} className={styles.text} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-fg text-sm font-semibold tracking-tight">
                    {row.key}
                  </p>
                  <p
                    className={cn(
                      "text-sm font-medium tabular-nums",
                      styles.text,
                    )}
                  >
                    {row.value}
                  </p>
                </div>
                {desc ? (
                  <p className="text-fg-subtle mt-1 text-[13px] leading-relaxed">
                    {desc}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
