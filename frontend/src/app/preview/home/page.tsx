import Link from "next/link";

import { HeroSearch } from "@/components/landing/HeroSearch";
import { cn } from "@/lib/cn";

/**
 * 로그인한 사용자의 첫 화면 비교 — 검토용.
 *
 * 진입 구조를 이렇게 나누기로 했다:
 *   비로그인 → 지금의 랜딩 스토리 (마지막 칸은 검색창 대신 `시작하기`)
 *   로그인   → 바로 검색창
 *   스토리   → /about 으로 옮겨 언제든 볼 수 있게
 *
 * 여기서는 세 번째 줄, 그러니까 **로그인한 사람이 보는 첫 화면**만
 * 세 가지로 그려 놓고 고른다. 검색창은 실물 컴포넌트(HeroSearch)를 그대로
 * 쓰므로 눌러 보면 실제 동작을 확인할 수 있다.
 *
 * 바탕은 셋 다 밝은 면으로 통일했다. 배경을 섞으면 비교하는 변수가 둘이
 * 된다 — 히어로 그라데이션으로 갈지는 구도를 고른 뒤에 따로 정한다.
 */

export const metadata = { title: "Fides — 첫 화면 비교" };

const SAMPLE_URL = "https://prod.danawa.com/info/?pcode=12345678";

const RECENT = [
  { name: "AI 절약 세탁기 21kg", company: "OO전자", missing: 67, risk: "높음", color: "var(--color-missing)" },
  { name: "QNED AI 75형", company: "OO전자", missing: 20, risk: "보통", color: "var(--color-partial)" },
  { name: "올인원 로봇청소기", company: "OO로보틱스", missing: 0, risk: "낮음", color: "var(--color-verified)" },
];

const LABEL = "font-mono text-xs tracking-[var(--tracking-label)] text-fg-faint";

/** 밝은 바탕에서는 흰 알약이 묻히므로 테두리를 준다 */
const SEARCH_ON_LIGHT =
  "[&_form]:border [&_form]:border-border [&_form]:shadow-[var(--shadow-input)]";

/** 화면 맥락을 보여주기 위한 헤더 — 실제로는 SiteHeader 가 온다 */
function MockHeader() {
  return (
    <div className="border-border flex items-center justify-between border-b px-6 py-3.5">
      <span className="fides-wordmark text-fg text-[15px] uppercase">Fides</span>
      <span className="text-fg-dim flex items-center gap-5 text-sm">
        대시보드
        <span className="text-fg-faint">reo91004</span>
      </span>
    </div>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-bg border-border overflow-hidden rounded-[var(--radius-panel)] border">
      <MockHeader />
      <div className="flex min-h-[440px] flex-col items-center justify-center px-6 py-16">
        {children}
      </div>
    </div>
  );
}

/* ══ A · 검색창 + 최소 안내 ══════════════════════════════════════════ */

function VariantA() {
  return (
    <Stage>
      <div className="w-full max-w-[460px] text-center">
        <p className="text-fg text-[19px] font-medium tracking-[var(--tracking-heading)]">
          주장이 아니라 근거로 판단합니다
        </p>
        <p className="text-fg-dim mt-2.5 text-xs leading-loose">
          다나와 상품 페이지 URL을 넣으면 AI 문구를 문장 단위로 뜯어내고
          공공 기록과 대조합니다.
        </p>

        <HeroSearch
          hideCategories
          className={cn("mt-7 flex flex-col items-center", SEARCH_ON_LIGHT)}
        />

        {/* 복사할 수 있는 예시. placeholder 는 `…` 로 끝나 붙여넣을 수 없다. */}
        <p className="text-fg-faint mt-5 font-mono text-xs break-all">
          예시 · {SAMPLE_URL}
        </p>

        <p className="mt-6 text-xs">
          <Link href="/about" className="text-brand-fg underline-offset-4 hover:underline">
            어떻게 판단하나요 →
          </Link>
        </p>
      </div>
    </Stage>
  );
}

/* ══ B · 검색창만 ════════════════════════════════════════════════════ */

function VariantB() {
  return (
    <Stage>
      <div className="w-full max-w-[460px]">
        <p className="fides-wordmark text-fg mb-8 text-center text-[22px] uppercase">
          Fides
        </p>
        <HeroSearch
          hideCategories
          className={cn("flex flex-col items-center", SEARCH_ON_LIGHT)}
        />
      </div>
    </Stage>
  );
}

/* ══ C · 검색창 + 최근 분석 ══════════════════════════════════════════ */

function VariantC() {
  return (
    <Stage>
      <div className="w-full max-w-[560px]">
        <div className="text-center">
          <p className="text-fg text-[19px] font-medium tracking-[var(--tracking-heading)]">
            무엇을 검증할까요
          </p>
          <HeroSearch
            hideCategories
            className={cn("mt-6 flex flex-col items-center", SEARCH_ON_LIGHT)}
          />
        </div>

        <div className="mt-12">
          <p className={LABEL}>최근 분석</p>
          <ul className="border-border divide-border mt-3.5 divide-y border-y">
            {RECENT.map((r) => (
              <li key={r.name} className="flex items-center gap-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="text-fg block truncate text-sm tracking-[var(--tracking-tight)]">
                    {r.name}
                  </span>
                  <span className="text-fg-dim mt-0.5 block text-xs">
                    {r.company}
                  </span>
                </span>
                <span className="text-fg-dim tnum shrink-0 text-xs">
                  근거 부재{" "}
                  <span style={{ color: r.color }}>{r.missing}%</span>
                </span>
                <span
                  className="w-[52px] shrink-0 text-right font-mono text-xs tracking-[var(--tracking-label)]"
                  style={{ color: r.color }}
                >
                  {r.risk}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Stage>
  );
}

/* ══ 말풍선 ══════════════════════════════════════════════════════════ */

function Bubble({
  from,
  children,
}: {
  from: "system" | "user";
  children: React.ReactNode;
}) {
  const mine = from === "user";
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <p
        className={cn(
          "max-w-[76%] rounded-[var(--radius-card)] px-3.5 py-2.5 text-xs leading-relaxed",
          mine
            ? "bg-fg text-fg-on-brand"
            : "bg-surface text-fg border-border border",
        )}
      >
        {children}
      </p>
    </div>
  );
}

function ChatField({ placeholder }: { placeholder: string }) {
  return (
    <div className="border-border bg-surface flex items-center gap-2 rounded-[var(--radius-pill)] border p-1.5 pl-4">
      <span className="text-fg-faint min-w-0 flex-1 truncate text-sm">
        {placeholder}
      </span>
      <span className="bg-brand-fg grid size-8 shrink-0 place-items-center rounded-full text-white">
        <span className="text-sm leading-none">↑</span>
      </span>
    </div>
  );
}

/* ══ D · 채팅형 입력 ═════════════════════════════════════════════════
   받을 수 있는 입력이 URL 하나뿐인데 대화창을 놓으면 어떻게 되는지 —
   두 번째 교환이 그 답이다. */

function VariantD() {
  return (
    <Stage>
      <div className="flex w-full max-w-[460px] flex-col gap-2.5">
        <Bubble from="system">
          분석할 상품 URL을 붙여넣어 주세요. 다나와 상품 페이지만 읽을 수 있어요.
        </Bubble>
        <Bubble from="user">세탁기 중에 AI 기능 좋은 거 추천해줘</Bubble>
        <Bubble from="system">
          죄송합니다. 다나와 상품 URL만 분석할 수 있습니다.
        </Bubble>
        <div className="mt-3">
          <ChatField placeholder="메시지를 입력하세요" />
        </div>
      </div>
    </Stage>
  );
}

/* ══ E · 결과 위에서 묻기 ════════════════════════════════════════════
   첫 화면이 아니라 분석 결과 아래에 붙는 자리다. 여기서는 대화가
   진짜다 — 되묻는 모든 값이 이미 파이프라인이 만들어 둔 것이다. */

function VariantE() {
  return (
    <Stage>
      <div className="w-full max-w-[520px]">
        <div className="border-border border-b pb-5">
          <p className={LABEL}>분석 결과</p>
          <p className="text-fg mt-2 text-sm tracking-[var(--tracking-tight)]">
            AI 절약 세탁기 21kg · OO전자
          </p>
          <p className="text-fg-dim mt-1 text-xs">
            주장 6개 중 근거 확인 1 · 부분 1 ·{" "}
            <span style={{ color: "var(--color-missing)" }}>없음 4</span>
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <Bubble from="user">
            왜 &lsquo;에너지 절약 자동 제어&rsquo;가 근거 없음이야?
          </Bubble>
          <Bubble from="system">
            조회한 9개 소스 어디에도 이 기능과 연결되는 기록이 없었습니다.
            KIPRIS 특허 0건, DART 공시 0건, TIPA 0건입니다. 같은 제품의
            &lsquo;인버터 DD 모터&rsquo;는 KC 인증과 전파인증에서 모델 단위로
            확인됐습니다.
          </Bubble>
          <div className="mt-3">
            <ChatField placeholder="이 결과에 대해 물어보세요" />
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ══ 페이지 ══════════════════════════════════════════════════════════ */

const VARIANTS = [
  {
    no: "A",
    name: "검색창 + 최소 안내",
    says: "한 줄 설명과 복사 가능한 예시 URL, 그리고 /about 으로 가는 링크를 답니다. 처음 온 사람도 무엇을 넣을지 압니다.",
    cost: "재방문자에게는 매번 같은 안내를 다시 읽히는 셈입니다.",
    render: <VariantA />,
  },
  {
    no: "B",
    name: "검색창만",
    says: "로고와 검색창뿐. 가장 깔끔하고 재방문자에게 최고입니다.",
    cost: "다나와 URL만 받는다는 걸 모르면 아무거나 넣고 막힙니다. 로그인한 사람이라 이미 한 번 써봤다는 전제가 필요합니다.",
    render: <VariantB />,
  },
  {
    no: "C",
    name: "검색창 + 최근 분석",
    says: "검색창 아래에 내가 최근 본 것을 붙입니다. 다시 열어보기가 쉬워지고 대시보드로 안 가도 됩니다.",
    cost: "기록이 없는 첫 사용자에게는 빈칸입니다. 대시보드와 역할이 겹칩니다.",
    render: <VariantC />,
  },
  {
    no: "D",
    name: "채팅형 입력 — 권하지 않습니다",
    says: "대화창을 첫 화면에 놓습니다. 요즘 AI 제품의 기본 모양이라 익숙하고 기대치가 높습니다.",
    cost: "백엔드가 받는 입력은 `{ url: str }` 하나뿐입니다. 대화창은 아무 말이나 걸 수 있다고 약속해 놓고 URL만 받습니다 — 두 번째 말풍선이 그 결과입니다. AI 워싱을 지적하는 서비스가 자기 UI에서 같은 짓을 하는 셈입니다.",
    render: <VariantD />,
  },
  {
    no: "E",
    name: "결과 위에서 묻기 — 이쪽이 진짜입니다",
    says: "첫 화면이 아니라 분석 결과 아래에 붙는 자리입니다. 되묻는 값이 전부 파이프라인이 이미 만들어 둔 것이라(주장별 판정 · 소스별 건수 · 3축 점수) 대화가 실제로 성립합니다.",
    cost: "결과에 답하는 엔드포인트가 아직 없습니다. 다만 파이프라인이 이미 Ollama 를 쓰고 있어 기반은 있습니다.",
    render: <VariantE />,
  },
];

export default function HomePreview() {
  return (
    <main className="bg-surface min-h-dvh pb-24">
      <div className="mx-auto w-full max-w-[1200px] px-5 pt-16 md:px-10">
        <p className={LABEL}>PREVIEW</p>
        <h1 className="text-fg mt-3 text-2xl font-medium tracking-[var(--tracking-heading)] md:text-[27px]">
          로그인한 사용자의 첫 화면 — 세 가지
        </h1>
        <div className="text-fg-dim mt-4 max-w-[760px] text-xs leading-loose">
          <p>진입 구조는 이렇게 나뉩니다:</p>
          <ul className="mt-2.5 flex flex-col gap-1">
            <li>· 비로그인 → 지금의 랜딩 스토리 (마지막 칸은 검색창 대신 `시작하기`)</li>
            <li>· 로그인 → 바로 검색창 (아래 셋 중 하나)</li>
            <li>· 스토리 → <code>/about</code> 으로 옮겨 언제든 볼 수 있게</li>
          </ul>
          <p className="mt-3">
            검색창은 실물 컴포넌트라 눌러 보면 실제로 동작합니다. 바탕은 셋 다
            밝은 면으로 통일했습니다 — 히어로 그라데이션으로 갈지는 구도를
            고른 뒤에 따로 정하면 됩니다.
          </p>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-14">
        {VARIANTS.map((v) => (
          <section key={v.no} className="mx-auto w-full max-w-[1200px] px-5 md:px-10">
            <div className="border-border border-t pt-5">
              <p className={LABEL}>변형 {v.no}</p>
              <h2 className="text-fg mt-2 text-[17px] font-medium tracking-[var(--tracking-tight)]">
                {v.name}
              </h2>
              <div className="mt-2 grid max-w-[920px] grid-cols-1 gap-x-10 gap-y-1.5 sm:grid-cols-2">
                <p className="text-fg-dim text-xs leading-relaxed">{v.says}</p>
                <p className="text-fg-faint text-xs leading-relaxed">↔ {v.cost}</p>
              </div>
            </div>
            <div className="mt-6">{v.render}</div>
          </section>
        ))}
      </div>
    </main>
  );
}
