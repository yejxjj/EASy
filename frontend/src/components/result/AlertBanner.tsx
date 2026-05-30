import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { scoreTier, tierStyles } from "@/lib/score";

interface AlertBannerProps {
  overallScore: number;
  overallLabel: string;
}

const COPY = {
  ok: {
    title: "AI 워싱 위험이 낮은 제품입니다",
    description:
      "공공 인증과 특허 등 검증 가능한 근거가 충분히 확인되었습니다. AI 주장의 구체성도 높은 편입니다.",
    Icon: CheckCircle2,
  },
  warn: {
    title: "일부 AI 주장이 검증되지 않았습니다",
    description:
      "공공 인증 일부 미보유 또는 마케팅 표현의 구체성이 부족한 항목이 발견되었습니다. 구매 전 추가 확인을 권장합니다.",
    Icon: Info,
  },
  danger: {
    title: "AI 워싱 가능성이 높은 제품입니다",
    description:
      "AI 핵심 기술 설명이 부재하고 공공 인증·특허 등 객관적 검증 근거가 매우 부족합니다. 표기된 'AI' 기능이 실체와 다를 가능성이 큽니다.",
    Icon: AlertTriangle,
  },
} as const;

export function AlertBanner({ overallScore, overallLabel }: AlertBannerProps) {
  const tier = scoreTier(overallScore);
  const { title, description, Icon } = COPY[tier];
  const styles = tierStyles[tier];

  return (
    <div
      role="alert"
      className={`${styles.bgSoft} flex items-start gap-3 rounded-[var(--radius-card)] border border-[color-mix(in_srgb,var(--color-fg)_4%,transparent)] px-5 py-4`}
    >
      <Icon size={20} className={`${styles.text} mt-0.5 shrink-0`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p
          className={`${styles.text} flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm font-bold tracking-tight`}
        >
          <span>{title}</span>
          <span className="text-fg-dim font-mono text-[10px] uppercase tracking-[0.12em]">
            {overallLabel}
          </span>
        </p>
        <p className="text-fg-muted mt-1 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
