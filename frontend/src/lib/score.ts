/**
 * Score → tier / colour mapping.
 *
 * ACCS는 신뢰도 점수: higher = better (신뢰도 높음 = 워싱 위험 낮음)
 */

import type { OverallLabel } from "@/types/analysis";

export type ScoreTier = "ok" | "warn" | "danger";
export type Dimension = "washing" | "text" | "verify" | "relational";

export function scoreTier(score: number): ScoreTier {
  if (score >= 60) return "ok";
  if (score >= 50) return "warn";
  return "danger";
}

export function overallLabelFor(score: number): OverallLabel {
  if (score >= 60) return "양호 구간";
  if (score >= 50) return "주의 구간";
  return "위험 구간";
}

/**
 * Caption shown under each KPI value. Reference baseline is intentionally
 * displayed in the text so the user understands the derivation.
 */
export function kpiBaselineCaption(value: number): string {
  const delta = value - 50;
  if (delta === 0) return "기준선 50점 대비 ±0";
  const sign = delta > 0 ? "+" : "−";
  return `기준선 50점 대비 ${sign}${Math.abs(delta)}`;
}

/** Tailwind class fragments grouped by tier. */
export const tierStyles: Record<
  ScoreTier,
  { text: string; bar: string; bgSoft: string; border: string }
> = {
  ok: {
    text: "text-ok",
    bar: "bg-ok",
    bgSoft: "bg-ok-soft",
    border: "border-ok",
  },
  warn: {
    text: "text-warn",
    bar: "bg-warn",
    bgSoft: "bg-warn-soft",
    border: "border-warn",
  },
  danger: {
    text: "text-danger",
    bar: "bg-danger",
    bgSoft: "bg-danger-soft",
    border: "border-danger",
  },
};

/**
 * Dimension styles — used by KPI cards and KPI bar fills. These colours come
 * from `--color-dim-*` tokens (defined in `globals.css`).
 *
 * Direct arbitrary `bg-[color:var(--…)]` classes are used so Tailwind picks
 * them up without any safelist.
 */
const DIMENSION_FILLS: Record<Dimension, string> = {
  washing: "bg-[color:var(--color-dim-washing)]",
  text: "bg-[color:var(--color-dim-text)]",
  verify: "bg-[color:var(--color-dim-verify)]",
  relational: "bg-[color:var(--color-dim-relational)]",
};

const DIMENSION_TEXTS: Record<Dimension, string> = {
  washing: "text-[color:var(--color-dim-washing)]",
  text: "text-[color:var(--color-dim-text)]",
  verify: "text-[color:var(--color-dim-verify)]",
  relational: "text-[color:var(--color-dim-relational)]",
};

const DIMENSION_LABELS: Record<Dimension, string> = {
  washing: "AI 워싱 위험도",
  text: "텍스트 신뢰도",
  verify: "검증 신뢰도",
  relational: "관계형 신뢰도",
};

export function dimensionFillClass(d: Dimension): string {
  return DIMENSION_FILLS[d];
}

export function dimensionTextClass(d: Dimension): string {
  return DIMENSION_TEXTS[d];
}

export function dimensionLabel(d: Dimension): string {
  return DIMENSION_LABELS[d];
}
