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

/**
 * 백엔드가 이미 판정한 라벨을 색으로 옮긴다.
 *
 * 점수에서 등급을 다시 계산하지 않는다. 이전에는 라벨 글자는 백엔드
 * `overall_label` 을 쓰면서 배지 색만 `scoreTier(value)` 로 따로 구해,
 * 백엔드 밴딩이 조금만 달라져도 "양호 구간"에 빨간 배지가 붙을 수 있었다.
 */
export function tierForLabel(label: OverallLabel): ScoreTier {
  if (label === "양호 구간") return "ok";
  if (label === "주의 구간") return "warn";
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

/**
 * 채널 이름은 analysis_engine.py 의 소스 묶음이 곧 정의다:
 *
 *   TES ← KIPRIS · DART                          → 기술 근거
 *   HES ← KC · RRA                               → 공인 인증
 *   CES ← TIPA · KORAIA · GS · NEP · 조달청       → 기관 이력
 *
 * 랜딩이 쓰는 이름과 같은 것이므로 그대로 맞춘다. 이전에는 TES 를
 * "텍스트 신뢰도", HES 를 "검증 신뢰도"라 불렀는데 둘 다 실제 근거와
 * 어긋난다 — TES 는 특허와 공시이지 텍스트가 아니다.
 *
 * 주의: 필드명이 헷갈린다. `verification_credibility` 가 HES(공인 인증),
 * `text_credibility` 가 TES(기술 근거)다 (server.py:770).
 */
const DIMENSION_LABELS: Record<Dimension, string> = {
  washing: "AI 워싱 위험도",
  text: "기술 근거",
  verify: "공인 인증",
  relational: "기관 이력",
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
