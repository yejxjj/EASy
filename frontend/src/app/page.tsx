import { ClaimLedger } from "@/components/claim/ClaimLedger";
import { CaseCard } from "@/components/landing/CaseCard";
import { ChromeObject } from "@/components/landing/ChromeObject";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { HeroSearch } from "@/components/landing/HeroSearch";
import { IconTile } from "@/components/landing/IconTile";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { SectionNav } from "@/components/landing/SectionNav";
import { SnapScroll } from "@/components/landing/SnapScroll";
import { GradientTile, StaggeredCards } from "@/components/landing/StaggeredCards";
import { WaveLines } from "@/components/landing/WaveLines";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { Section } from "@/components/primitives/Section";
import type { Claim } from "@/types/analysis";

/**
 * 랜딩.
 *
 * 여섯 개의 풀스크린 섹션이 스냅 지점이 된다. 스크롤 한 번에 한 화면씩
 * 넘어가되, 구현은 CSS scroll-snap 이다 — 이전 랜딩처럼 wheel 이벤트를
 * 가로채지 않으므로 트랙패드·키보드·스크롤 복원이 정상 동작한다.
 * (규칙은 globals.css 의 `html.fides-snap`, 토글은 SnapScroll)
 *
 * 서버 컴포넌트로 두고 상호작용이 필요한 조각만 클라이언트로 내린다.
 */

const SECTIONS = [
  { id: "hero", label: "소개", dark: true },
  { id: "channels", label: "검증 채널", dark: true },
  { id: "product", label: "제품과 리포트" },
  { id: "ledger", label: "대조 뷰" },
  { id: "cases", label: "분석 사례" },
  { id: "start", label: "시작하기" },
];

/** 실데이터 연결 전까지 쓰는 예시. 4단계에서 백엔드 `claims` 로 교체한다. */
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
    evidence: [{ source: "TIPA", label: "TIPA 제조AI 참여 이력", record_id: null }],
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

export default function LandingPage() {
  return (
    <>
      <SnapScroll />
      <SectionNav items={SECTIONS} />
      <FloatingActions />

      {/* ── 히어로 ────────────────────────────────────────────── */}
      <Section id="hero" tone="gradient" bare full>
        <LandingNav />
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-5 pt-24 pb-20 md:flex-row md:items-center md:px-10">
          <div className="min-w-0 flex-1">
            <Eyebrow className="text-white/70">Evidence over Claims</Eyebrow>
            <h1 className="mt-5 text-[28px] leading-[1.4] font-medium tracking-[var(--tracking-heading)] text-white md:text-[34px]">
              주장이 아니라 근거로
              <br />
              판단하는 AI 검증,
              <br />
              오직 Fides에서
            </h1>
            <a
              href="#channels"
              className="mt-8 inline-block rounded-[var(--radius-input)] border border-white/55 px-6 py-2.5 text-xs text-white transition-colors hover:bg-white/10"
            >
              자세히 보기
            </a>
          </div>

          <ChromeObject className="h-[200px] w-[250px] shrink-0 self-center md:h-[270px] md:w-[330px]" />
        </div>
      </Section>

      {/* ── 검증 채널 ─────────────────────────────────────────── */}
      <Section id="channels" tone="ink" bare full>
        <WaveLines className="w-[170px] opacity-50" />
        <div className="relative mx-auto flex w-full max-w-[1200px] flex-col gap-9 px-5 py-16 md:flex-row md:px-10">
          <div className="md:w-[32%] md:shrink-0">
            <h2 className="text-2xl font-medium tracking-[var(--tracking-heading)] md:text-[26px]">
              Our Channels
            </h2>
            <p className="text-fg-subtle mt-4 text-xs leading-loose">
              공공 기록을 기반으로
              <br />
              주장의 진위를 가리는
              <br />
              네 개의 검증 채널을
              <br />
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

      {/* ── 제품과 리포트 ─────────────────────────────────────── */}
      <Section id="product" tone="canvas" full>
        <div className="flex flex-col gap-9 md:flex-row md:items-center">
          <StaggeredCards className="flex-1" offset={30}>
            <IconTile
              tone="blue"
              title="대조 뷰"
              description={"주장 문장과 근거를\n선으로 연결해 보여줍니다"}
              href="#ledger"
            />
            <IconTile
              tone="coral"
              title="위험 리포트"
              description={"근거가 끊긴 주장만\n추려 PDF로 내보냅니다"}
            />
            <IconTile
              tone="green"
              title="제품 비교"
              description={"최대 3개 제품의\n채널별 점수를 나란히"}
              href="/compare"
            />
            <IconTile
              tone="violet"
              title="워치리스트"
              description={"관심 제품을 등록하고\n재검증 이력을 추적"}
              href="/dashboard"
            />
          </StaggeredCards>

          <div className="md:w-[30%] md:shrink-0 md:text-right">
            <h2 className="text-fg text-2xl leading-tight font-medium tracking-[var(--tracking-heading)] md:text-[26px]">
              Product
              <br />
              &amp; Report
            </h2>
            <p className="text-fg-dim mt-4 text-xs leading-loose">
              검증 결과를 실무에서
              <br />
              바로 쓸 수 있는 형태로
              <br />
              제공합니다.
            </p>
          </div>
        </div>
      </Section>

      {/* ── 대조 뷰 ───────────────────────────────────────────── */}
      <Section id="ledger" tone="surface" full>
        <h2 className="text-fg text-2xl font-medium tracking-[var(--tracking-heading)] md:text-[26px]">
          대조 뷰
        </h2>
        <p className="text-fg-dim mt-2.5 text-xs">
          제품 페이지의 문장 하나하나에 근거를 붙여 봅니다. 붙지 않는 문장이
          결론입니다.
        </p>
        <ClaimLedger claims={SAMPLE_CLAIMS} className="mt-6" />
      </Section>

      {/* ── 분석 사례 ─────────────────────────────────────────── */}
      <Section id="cases" tone="canvas" full>
        <h2 className="text-fg text-2xl font-medium tracking-[var(--tracking-heading)] md:text-[26px]">
          분석 사례
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* ── 시작하기 + 푸터 ───────────────────────────────────── */}
      <Section id="start" tone="surface" bare full snapAlign="end">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col justify-center gap-10 px-5 py-14 md:px-10">
          <CtaBanner
            headline="근거 없는 “AI 탑재”를 지금 걸러내세요"
            action={<HeroSearch className="flex flex-col items-center" />}
          />
          <LandingFooter />
        </div>
      </Section>
    </>
  );
}
