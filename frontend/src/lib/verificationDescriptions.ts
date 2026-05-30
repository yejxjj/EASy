/**
 * Frontend hardcode dictionary for `VerificationRow.key` → human description.
 *
 * The backend's `VerificationRow` only ships `key`, `value`, and `intent` —
 * this maps each well-known key to a short user-facing description. New
 * backend keys should be added here. Unknown keys fall back to no description.
 *
 * (v2 1차 결정: backend 스키마는 변경하지 않고 frontend hardcode dict로 처리.)
 */
export const VERIFICATION_DESCRIPTIONS: Record<string, string> = {
  "AI 주장 수":
    "제품 페이지에서 추출한 'AI' 관련 마케팅 주장의 총 건수입니다.",
  "KC 인증":
    "전파법·전기용품안전관리법 등 국내 필수 인증 보유 여부입니다.",
  "조달청 AI 우수제품":
    "조달청의 AI 우수제품 등록 여부입니다. 제3자 검증된 AI 제품임을 의미합니다.",
  "TIPA AI 검증":
    "중소벤처기업진흥공단 산하 TIPA의 AI 기술 검증 통과 여부입니다.",
  "KORAIA 회원사":
    "한국인공지능산업협회 회원사 등록 여부입니다.",
  "AI 관련 특허":
    "KIPRIS에서 검색한 제조사의 AI 관련 등록 특허 보유 건수입니다.",
  "GS 인증":
    "Good Software 인증 (TTA) 보유 여부입니다.",
  "NEP 신제품 인증":
    "산업통상자원부 신제품(NEP) 인증 보유 여부입니다.",
};

export function descriptionFor(key: string): string | null {
  return VERIFICATION_DESCRIPTIONS[key] ?? null;
}
