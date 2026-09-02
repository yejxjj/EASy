import type { ClaimStatus } from "@/types/analysis";

/**
 * 판정 3색 체계 한 벌.
 *
 * 대조 뷰는 두 가지 모습으로 존재한다 — 랜딩의 조회 매트릭스(ClaimMatrix)와
 * 결과·디자인 페이지의 목록(ClaimLedger). 매트릭스는 주장이 서넛일 때
 * "빈 줄이 곧 결론"을 한눈에 보여주고, 주장이 열댓 개로 늘면 열이 넘쳐
 * 못 쓴다. 반대로 목록은 훑기에 강하지만 조회 결과를 숫자로 못 보여준다.
 *
 * 그래서 형태는 둘로 두되 색·파선·라벨은 여기 한 곳에서만 정의한다.
 * 두 화면이 다른 언어를 쓰기 시작하면 랜딩만 멋진 화면이 된다.
 *
 *   verified  근거 확인   실선
 *   partial   부분 일치   긴 파선
 *   unsupported 근거 없음 짧은 파선 + 끊김
 */

export interface StatusStyle {
  label: string;
  /** 연결선·라벨 색 */
  color: string;
  /** 실선/여백 구간(px). null 이면 실선 */
  dash: [on: number, off: number] | null;
  /** 선이 상대까지 닿는가. 근거가 없으면 허공에서 끊긴다 */
  reaches: boolean;
}

export const CLAIM_STATUS: Record<ClaimStatus, StatusStyle> = {
  verified: {
    label: "확인됨",
    color: "var(--color-verified)",
    dash: null,
    reaches: true,
  },
  partial: {
    label: "부분 일치",
    color: "var(--color-partial)",
    dash: [5, 3],
    reaches: true,
  },
  unsupported: {
    label: "대응 근거 없음",
    color: "var(--color-missing)",
    dash: [3, 4],
    reaches: false,
  },
};

/**
 * 파선 패턴을 배경 그라데이션으로 만든다.
 * `border-style: dashed` 는 간격을 정할 수 없어 쓰지 않는다.
 */
export function dashBackground(style: StatusStyle, axis: "x" | "y") {
  if (!style.dash) return style.color;
  const dir = axis === "x" ? "to right" : "to bottom";
  const [on, off] = style.dash;
  return `repeating-linear-gradient(${dir}, ${style.color} 0 ${on}px, transparent ${on}px ${on + off}px)`;
}
