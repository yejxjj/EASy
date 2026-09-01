import { ClaimLedger } from "@/components/claim/ClaimLedger";
import { CaseCard } from "@/components/landing/CaseCard";
import { ChromeObject } from "@/components/landing/ChromeObject";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { HeroSearch } from "@/components/landing/HeroSearch";
import { GradientTile, StaggeredCards } from "@/components/landing/StaggeredCards";
import { WaveLines } from "@/components/landing/WaveLines";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { Marquee } from "@/components/primitives/Marquee";
import { Section } from "@/components/primitives/Section";
import type { Claim } from "@/types/analysis";

/**
 * 디자인 시스템 갤러리 — 프리미티브를 한자리에서 보는 곳.
 *
 * 랜딩을 재작성하기 전에 각 조각이 제대로 서는지 확인하는 용도이고,
 * 이후에도 살아있는 문서로 남긴다. 프로덕션 라우트가 아니다.
 */

export const metadata = { title: "Fides — 디자인 시스템" };

const SOURCES = [
  "KIPRIS 특허",
  "DART 공시",
  "KC 인증",
  "전파인증 RRA",
  "TIPA",
  "KORAIA",
  "GS 인증",
  "NEP",
  "조달청 MAS",
];

const SAMPLE_CLAIMS: Claim[] = [
  {
    id: "c1",
    text: "에너지 절약 자동 제어",
    quote: "AI 절약 모드로 최대 30% 전기 절감",
    status: "unsupported",
    evidence: [],
    note: "KIPRIS 0건 · DART 0건",
  },
  {
    id: "c2",
    text: "세탁 코스 자동 추천",
    quote: "AI 자동 코스 추천",
    status: "partial",
    evidence: [
      { source: "TIPA", label: "TIPA 제조AI 참여 이력", record_id: null },
    ],
    note: null,
  },
  {
    id: "c3",
    text: "인버터 DD 모터",
    quote: "인버터 DD 모터 탑재",
    status: "verified",
    evidence: [
      { source: "KC", label: "KC 인증 · 모델 단위 대조", record_id: null },
      { source: "RRA", label: "전파인증 확인", record_id: null },
    ],
    note: null,
  },
];

export default function DesignSystemPage() {
  return (
    <main>
      {/* ── 히어로 ─────────────────────────────────────────────── */}
      <Section tone="gradient" bare>
        <div className="relative mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-5 py-16 md:flex-row md:items-center md:px-10 md:py-24">
          <div className="min-w-0 flex-1">
            <Eyebrow className="text-white/70">Evidence over Claims</Eyebrow>
            <h1 className="mt-4 text-3xl leading-tight font-medium tracking-[var(--tracking-heading)] text-white md:text-4xl">
              주장이 아니라 기록으로
              <br />
              판별하는 AI 검증
            </h1>
            <HeroSearch className="mt-7" />
          </div>
          <ChromeObject className="h-[190px] w-[240px] shrink-0 self-center md:h-[240px] md:w-[300px]" />
        </div>
      </Section>

      {/* ── 마퀴 ───────────────────────────────────────────────── */}
      <div className="bg-brand-fg py-3 text-white">
        <Marquee items={SOURCES} itemClassName="text-sm" />
      </div>

      {/* ── 계단식 카드 ─────────────────────────────────────────── */}
      <Section tone="ink" bare>
        <WaveLines className="w-[170px] opacity-50" />
        <div className="relative mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-5 py-14 md:flex-row md:px-10 md:py-20">
          <div className="md:w-[32%] md:shrink-0">
            <h2 className="text-2xl font-medium tracking-[var(--tracking-heading)]">
              Our Channels
            </h2>
            <p className="text-fg-subtle mt-3 text-xs leading-loose">
              공공 기록을 근거로 주장의 진위를 가리는 네 개의 검증 축을
              제공합니다.
            </p>
          </div>
          <StaggeredCards className="flex-1">
            <GradientTile
              eyebrow="Technical · w 0.40"
              title="기술 근거 검증"
              description={<>KIPRIS 특허 출원 이력과 DART 공시 R&amp;D 대조</>}
            />
            <GradientTile
              eyebrow="Horizontal · w 0.35"
              title="공인 인증 조회"
              description="KC 인증 · 전파인증 RRA 제품 모델 단위 확인"
              glowCorner="tr"
            />
            <GradientTile
              eyebrow="Contextual · w 0.25"
              title="기관 이력 대조"
              description="TIPA · KORAIA · GS · NEP 조달청 MAS 공인 이력"
              glowCorner="bl"
            />
            <GradientTile
              eyebrow="Explainable"
              title="판단 근거 공개"
              description="점수에 기여한 요인과 가중치를 그대로 노출"
              deep
              glowCorner="none"
            />
          </StaggeredCards>
        </div>
      </Section>

      {/* ── 대조 뷰 ─────────────────────────────────────────────── */}
      <Section tone="surface">
        <Eyebrow>Claim &amp; Evidence</Eyebrow>
        <h2 className="mt-3 text-2xl font-medium tracking-[var(--tracking-heading)]">
          문장 하나하나에 근거를 붙여 봅니다
        </h2>
        <p className="text-fg-dim mt-2 text-xs">
          붙지 않고 남는 문장이 곧 결론입니다
        </p>
        <ClaimLedger claims={SAMPLE_CLAIMS} className="mt-6" />
      </Section>

      {/* ── 사례 카드 ───────────────────────────────────────────── */}
      <Section tone="canvas">
        <h2 className="text-2xl font-medium tracking-[var(--tracking-heading)]">
          분석 사례
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CaseCard
            category="가전 · 세탁기"
            headline={"“AI 절약 모드”\n근거는 0건"}
            summary="OO전자 AI 절약 세탁기 21kg, 특허 이력 부재로 High Risk 판정"
            tags={["가전", "특허부재", "HighRisk"]}
            tone="blue"
          />
          <CaseCard
            category="생활가전 · 로봇청소기"
            headline={"사물 인식 AI,\n인증으로 확인"}
            summary="OO로보틱스 올인원, KC 인증과 특허 모두 대조 성공"
            tags={["로봇청소기", "근거확인", "Safe"]}
            tone="green"
          />
          <CaseCard
            category="TV · 디스플레이"
            headline={"AI 화질 엔진,\n부분 입증"}
            summary="OO전자 QNED 75형, 기업 이력만 확인되고 제품 단위 근거 없음"
            tags={["TV", "부분일치", "Medium"]}
            tone="violet"
          />
        </div>
      </Section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <Section tone="surface" compact>
        <CtaBanner
          headline="근거 없는 “AI 탑재”를 지금 걸러내세요"
          actionLabel="검증 시작하기"
          href="/login"
        />
      </Section>

      {/* ── 토큰 표 ─────────────────────────────────────────────── */}
      <Section tone="canvas" compact>
        <Eyebrow>Tokens</Eyebrow>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[
            ["bg", "--color-bg"],
            ["surface", "--color-surface"],
            ["ink", "--color-ink"],
            ["ink-soft", "--color-ink-soft"],
            ["brand", "--color-brand"],
            ["brand-fg", "--color-brand-fg"],
            ["accent", "--color-accent"],
            ["verified", "--color-verified"],
            ["partial", "--color-partial"],
            ["missing", "--color-missing"],
            ["fg", "--color-fg"],
            ["fg-dim", "--color-fg-dim"],
          ].map(([name, token]) => (
            <div key={token} className="flex items-center gap-2.5">
              <span
                className="border-border size-9 shrink-0 rounded-[var(--radius-input)] border"
                style={{ background: `var(${token})` }}
              />
              <span className="min-w-0">
                <span className="text-fg block truncate text-xs font-medium">
                  {name}
                </span>
                <span className="text-fg-dim block truncate font-mono text-xs">
                  {token}
                </span>
              </span>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
