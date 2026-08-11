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
import { AdQuotes } from "@/components/landing/story/AdQuotes";
import { ContrastList } from "@/components/landing/story/ContrastList";
import { SourceTable } from "@/components/landing/story/SourceTable";
import { StatGrid } from "@/components/landing/story/StatGrid";
import { StepFlow } from "@/components/landing/story/StepFlow";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { Section } from "@/components/primitives/Section";
import type { Claim } from "@/types/analysis";

/**
 * 랜딩.
 *
 * 서사 순서로 읽힌다:
 *   실물을 들이대고(문제) → 규모를 보이고(통계) → 해법을 꺼내고(3단계)
 *   → 어떻게 보이는지 증명하고(대조 뷰) → 근거와 채널을 밝히고
 *   → 기존과 무엇이 다른지 대조하고 → 전환으로 닫는다.
 *
 * 각 섹션이 한 화면이고 CSS scroll-snap 으로 한 번에 한 화면씩 넘어간다.
 * (규칙은 globals.css 의 `html.fides-snap`, 토글은 SnapScroll)
 *
 * 서버 컴포넌트로 두고 상호작용이 필요한 조각만 클라이언트로 내린다.
 */

const SECTIONS = [
  { id: "hero", label: "소개", dark: true },
  { id: "problem", label: "AI 워싱", dark: true },
  { id: "scale", label: "실태" },
  { id: "approach", label: "해결 방식" },
  { id: "ledger", label: "대조 뷰" },
  { id: "channels", label: "검증 채널", dark: true },
  { id: "sources", label: "근거 소스" },
  { id: "difference", label: "차별성" },
  { id: "product", label: "제품과 리포트" },
  { id: "cases", label: "분석 사례" },
  { id: "start", label: "시작하기" },
];

/** 실제 상품 페이지에서 흔히 보이는 표현. 특정 브랜드는 지목하지 않는다. */
const AD_QUOTES = [
  {
    headline: "인공지능 DD",
    body: "청바지, 셔츠 등 세탁물의 무게와 부드러움을 감지해 세탁 패턴을 맞춥니다",
  },
  {
    headline: "AI 매직 리모컨",
    body: "AI 버튼을 눌러 궁금한 것을 물어보거나 도움을 요청하세요",
  },
  {
    headline: "인공지능 냉기케어 시스템",
    body: "사용 패턴에 맞춰 생각하고 움직입니다",
  },
];

const GLOBAL_STATS = [
  {
    value: 58,
    label: "글로벌 기업",
    caption: "AI 역량을 실제보다 부풀려 알린 적이 있다고 답한 비율",
    tone: "missing" as const,
  },
  {
    value: 72,
    label: "북미 기업",
    caption: "같은 질문에 그렇다고 답한 비율 — 시장이 클수록 높아진다",
    tone: "missing" as const,
  },
];

const DOMESTIC_STATS = [
  {
    value: 61,
    label: "전담조직 부재",
    caption: "AI 신뢰성을 검토할 조직을 두지 않은 국내 기업 비율",
    tone: "missing" as const,
  },
  {
    value: 48,
    label: "검증절차 부재",
    caption: "주장을 검증하는 절차 자체가 없다고 답한 비율",
    tone: "missing" as const,
  },
];

const STEPS = [
  {
    title: "AI 주장 추출",
    items: [
      "상품 페이지와 상세 이미지에서 AI 관련 문구를 걷어냅니다",
      "핵심 주장 요소를 기능 단위로 구조화합니다",
      "분석 대상을 자동으로 분류합니다",
    ],
  },
  {
    title: "근거 데이터 검증",
    items: [
      "특허 · 인증 · 공시 9개 소스를 병렬로 조회합니다",
      "주장과 근거가 실제로 맞물리는지 대조합니다",
      "근거 부족과 과장 가능성을 탐지합니다",
    ],
  },
  {
    title: "평가 결과 제공",
    items: [
      "신뢰성과 설명 충분성을 점수로 산출합니다",
      "AI 워싱 위험도를 등급으로 제시합니다",
      "판단에 쓰인 근거를 그대로 공개합니다",
    ],
  },
];

/** ontology/source_credibility_master.csv 의 값을 그대로 옮겼다. */
const SOURCES = [
  { name: "KC · 전파인증 DB", role: "제품 실체와 모델 단위 하드웨어 존재 확인", weight: 0.95 },
  { name: "RRA 전파인증", role: "통신 · 전파 장치 관련 제품과 모델 확인", weight: 0.95 },
  { name: "DART 전자공시", role: "기업 차원의 AI 사업 · 투자 · 기술 방향 확인", weight: 0.92 },
  { name: "KIPRIS 특허", role: "기술 보유와 알고리즘 · 모델 관련 근거", weight: 0.9 },
  { name: "GS 인증", role: "소프트웨어 품질과 제품 단위 인증 근거", weight: 0.88 },
  { name: "NEP 인증", role: "신기술성 인증 근거", weight: 0.88 },
  { name: "TIPA 공급기업", role: "기업 차원의 AI 솔루션 보유 여부 확인", weight: 0.8 },
  { name: "조달청 등록 정보", role: "공공 조달 등록 제품의 설명과 기능 확인", weight: 0.78 },
  { name: "KORAIA 협회 정보", role: "기업의 AI 관련 활동 존재 여부 보조 확인", weight: 0.72 },
];

const CONTRASTS = [
  {
    axis: "타겟 차별성",
    title: "주장의 신뢰성에 초점",
    before: "내부 AI 시스템 운영과 리스크 관리 중심",
    after: "상품과 기업이 밖으로 내세운 AI 주장 자체를 검증",
  },
  {
    axis: "분석 차별성",
    title: "주장과 근거를 연결해 분석",
    before: "정책 준수 · 모니터링 · 컴플라이언스 중심",
    after: "외부 공공 근거 데이터와 교차검증",
  },
  {
    axis: "결과 차별성",
    title: "신뢰성과 설명 충분성을 제시",
    before: "기업 내부용 거버넌스 · 감사 도구 중심",
    after: "소비자가 이해할 수 있는 설명형 평가 결과",
  },
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
    evidence: [{ source: "TIPA", label: "TIPA 공급기업 등록 이력", record_id: null }],
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
              href="#problem"
              className="mt-8 inline-block rounded-[var(--radius-input)] border border-white/55 px-6 py-2.5 text-xs text-white transition-colors hover:bg-white/10"
            >
              자세히 보기
            </a>
          </div>

          <ChromeObject className="h-[200px] w-[250px] shrink-0 self-center md:h-[270px] md:w-[330px]" />
        </div>
      </Section>

      {/* ── 문제: 실물을 먼저 들이댄다 ─────────────────────────── */}
      <Section id="problem" tone="ink" full>
        <Eyebrow className="text-white/45">The Problem</Eyebrow>
        <h2 className="mt-4 text-2xl leading-snug font-medium tracking-[var(--tracking-heading)] md:text-[27px]">
          이 문장들은 지금 팔리는 제품에
          <br />
          그대로 적혀 있습니다
        </h2>

        <AdQuotes quotes={AD_QUOTES} className="mt-8" />

        <p className="mt-8 max-w-[560px] text-xs leading-loose text-white/60">
          <strong className="font-medium text-white">AI 워싱</strong> — 실제 AI
          기술이 없거나 미미함에도 AI 기능을 과장해 소비자를 오인하게 만드는
          행위. 소비자는 더 비싼 값을 치르고, 정보 비대칭은 깊어지며, 결국 기업과
          플랫폼의 신뢰가 함께 무너집니다.
        </p>
      </Section>

      {/* ── 규모: 얼마나 흔한가 ───────────────────────────────── */}
      <Section id="scale" tone="canvas" full>
        <Eyebrow>The Scale</Eyebrow>
        <h2 className="text-fg mt-4 text-2xl leading-snug font-medium tracking-[var(--tracking-heading)] md:text-[27px]">
          드문 일이 아닙니다.
          <br />
          그리고 막을 장치도 없습니다.
        </h2>

        <div className="mt-9 grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-2">
          <StatGrid
            stats={GLOBAL_STATS}
            source="Google Cloud · 글로벌 16개국 임원 1,400여 명 조사"
          />
          <StatGrid
            stats={DOMESTIC_STATS}
            source="대한상공회의소 · 기업 실태 조사"
          />
        </div>
      </Section>

      {/* ── 해법 선언 ─────────────────────────────────────────── */}
      <Section id="approach" tone="surface" full>
        <Eyebrow>The Approach</Eyebrow>
        <h2 className="text-fg mt-4 text-2xl leading-snug font-medium tracking-[var(--tracking-heading)] md:text-[27px]">
          그래서 광고가 아니라
          <br />
          <span className="text-brand-fg">기록을 읽기로 했습니다</span>
        </h2>
        <p className="text-fg-dim mt-3.5 max-w-[560px] text-xs leading-loose">
          상품 URL 하나를 넣으면 주장을 문장 단위로 뜯어내고, 국가 데이터베이스에
          남은 흔적과 하나씩 맞춰봅니다.
        </p>

        <StepFlow steps={STEPS} className="mt-10" />
      </Section>

      {/* ── 대조 뷰: 어떻게 보이는지 증명 ─────────────────────── */}
      <Section id="ledger" tone="canvas" full>
        <Eyebrow>Claim &amp; Evidence</Eyebrow>
        <h2 className="text-fg mt-4 text-2xl font-medium tracking-[var(--tracking-heading)] md:text-[27px]">
          붙지 않는 문장이 결론입니다
        </h2>
        <p className="text-fg-dim mt-2.5 text-xs">
          주장마다 대응하는 공공 기록을 찾아 선으로 잇습니다. 선이 끊긴 자리가
          곧 AI 워싱 위험입니다.
        </p>
        <ClaimLedger claims={SAMPLE_CLAIMS} className="mt-6" />
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
              세 채널을 교차해 하나의 점수로 수렴시킵니다. 가중치는 고정값이
              아니라 근거 강도에 따라 매번 다시 계산됩니다.
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
              description="TIPA · KORAIA · GS · NEP · 조달청 공인 이력"
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

      {/* ── 근거 소스 ─────────────────────────────────────────── */}
      <Section id="sources" tone="surface" full>
        <Eyebrow>Evidence Sources</Eyebrow>
        <h2 className="text-fg mt-4 text-2xl font-medium tracking-[var(--tracking-heading)] md:text-[27px]">
          무엇을 근거로 삼는지 밝힙니다
        </h2>
        <p className="text-fg-dim mt-2.5 max-w-[600px] text-xs leading-loose">
          9개 공공 소스를 병렬로 조회합니다. 오른쪽 숫자는 각 소스에 부여된
          신뢰도 가중치로, 채점에 그대로 쓰이는 값입니다.
        </p>
        <SourceTable sources={SOURCES} className="mt-7" />
      </Section>

      {/* ── 차별성 ────────────────────────────────────────────── */}
      <Section id="difference" tone="canvas" full>
        <Eyebrow>What Makes It Different</Eyebrow>
        <h2 className="text-fg mt-4 text-2xl font-medium tracking-[var(--tracking-heading)] md:text-[27px]">
          기존 도구는 안을 봅니다.
          <br />
          Fides는 밖을 봅니다.
        </h2>
        <ContrastList items={CONTRASTS} className="mt-8" />
      </Section>

      {/* ── 제품과 리포트 ─────────────────────────────────────── */}
      <Section id="product" tone="surface" full>
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
