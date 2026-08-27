import { CompareView } from "@/components/compare/CompareView";
import type { Claim } from "@/types/analysis";
import type { CompareItem } from "@/types/auth";

/**
 * 비교 화면 표본.
 *
 * `/compare` 는 로그인 + 기록 2건이 있어야 열린다. 실물 `CompareView` 를
 * 그대로 띄워 조판을 확인하려고 둔다.
 *
 * 두 경우를 나란히 본다:
 *   위  주장 자료가 있는 기록  — 근거 확인 건수와 주장별 대조가 나온다
 *   아래 옛 기록               — capability_scores 가 없어 점수만 남는다
 */

export const metadata = { title: "Fides — 비교 화면 표본" };

function claim(
  id: string,
  text: string,
  quote: string | null,
  status: Claim["status"],
  evidence: Claim["evidence"],
  note: string | null,
): Claim {
  return { id, text, quote, status, evidence, note };
}

const KC = { source: "kc", label: "KC 인증", record_id: null };
const RRA = { source: "rra", label: "RRA 전파인증", record_id: null };
const TIPA = { source: "tipa", label: "TIPA 공급기업", record_id: null };
const KIPRIS = { source: "kipris", label: "KIPRIS 특허", record_id: null };

const WITH_CLAIMS: CompareItem[] = [
  {
    id: 1,
    product_name: "AI 절약 세탁기 21kg",
    company_name: "OO전자",
    category: "세탁기",
    accs_score: 31.4,
    verdict: "근거 부족 (워싱 의심)",
    risk_level: "높음",
    created_at: "2026.08.17",
    text_credibility: 42.0,
    verification_credibility: 18.0,
    relational_credibility: 35.0,
    claims: [
      claim("a1", "에너지 절약 자동 제어", "AI 절약 모드로 최대 30% 전기 절감", "unsupported", [], "특허 근거 · 인증 근거"),
      claim("a2", "세탁 코스 자동 추천", "AI 자동 코스 추천", "partial", [TIPA], "특허 근거"),
      claim("a3", "인버터 DD 모터", "인버터 DD 모터 탑재", "verified", [KIPRIS, KC, RRA], null),
    ],
    claims_rollup: { total: 3, verified: 1, partial: 1, missing: 1 },
  },
  {
    id: 2,
    product_name: "스마트 케어 건조기 17kg",
    company_name: "XX홈",
    category: "건조기",
    accs_score: 22.0,
    verdict: "근거 부족 (워싱 의심)",
    risk_level: "높음",
    created_at: "2026.08.17",
    text_credibility: 12.0,
    verification_credibility: 30.0,
    relational_credibility: 24.0,
    claims: [
      claim("b1", "AI 건조 시간 자동 조절", "입력한 옷감을 AI 가 판단", "unsupported", [], "특허 근거 · 인증 근거"),
      claim("b2", "습도 센서 제어", "습도 센서로 과건조 방지", "partial", [KC], "특허 근거"),
      claim("b3", "저온 제습 방식", null, "unsupported", [], "특허 근거 · 인증 근거"),
      claim("b4", "필터 자동 세척", "필터 자동 세척", "unsupported", [], "인증 근거"),
    ],
    claims_rollup: { total: 4, verified: 0, partial: 1, missing: 3 },
  },
];

/**
 * 확인된 주장이 양쪽 다 0건인 경우.
 * 옛 화면이 여기에 "AI 추천" 배지를 붙였다 — 점수만 보고 31점짜리를
 * 추천했다. 지금은 근거가 없다는 사실을 결론 줄이 먼저 말한다.
 */
const NONE_VERIFIED: CompareItem[] = WITH_CLAIMS.map((it) => ({
  ...it,
  claims: (it.claims ?? []).map((c) =>
    c.status === "verified"
      ? { ...c, status: "partial" as const, note: "인증 근거" }
      : c,
  ),
  claims_rollup: {
    total: it.claims_rollup!.total,
    verified: 0,
    partial: it.claims_rollup!.partial + it.claims_rollup!.verified,
    missing: it.claims_rollup!.missing,
  },
}));

/** 이번 변경 이전에 만들어진 기록 — 주장 자료가 없다 */
const LEGACY: CompareItem[] = WITH_CLAIMS.map((it) => ({
  ...it,
  claims: undefined,
  claims_rollup: undefined,
}));

export default function PreviewComparePage() {
  return (
    <div className="bg-bg">
      <Frame
        title="주장 자료가 있는 기록"
        note="근거 확인 건수가 표 맨 위에 오고, 아래에 주장별 대조가 붙는다. 두 제품 모두 확인된 주장이 0건이면 그 사실을 결론 줄이 먼저 말한다."
      >
        <CompareView items={WITH_CLAIMS} bare />
      </Frame>

      <Frame
        title="양쪽 다 확인 0건"
        note="옛 화면이 여기에 파란 `AI 추천` 배지를 붙였다 — 근거가 하나도 안 붙은 제품을 점수만 보고 골라 준 것이다. 지금은 점수 차이가 입증 차이가 아니라는 말이 먼저 온다."
      >
        <CompareView items={NONE_VERIFIED} bare />
      </Frame>

      <Frame
        title="옛 기록 — capability_scores 없음"
        note="주장 자료가 없으면 근거 칸은 `자료 없음`, 주장별 대조 절은 통째로 접힌다. 없는 근거를 0건이라고 단정하지 않는다."
      >
        <CompareView items={LEGACY} bare />
      </Frame>
    </div>
  );
}

function Frame({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-[1320px] px-5 py-10 md:px-10">
      <p className="text-fg-faint font-mono text-xs tracking-[var(--tracking-label)]">
        {title}
      </p>
      <p className="text-fg-dim mt-2 max-w-[70ch] text-sm leading-relaxed">
        {note}
      </p>
      <div className="border-border mt-6 overflow-hidden rounded-[var(--radius-panel)] border">
        {children}
      </div>
    </section>
  );
}
