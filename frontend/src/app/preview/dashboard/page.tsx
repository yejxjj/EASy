import { Fragment } from "react";

import { cn } from "@/lib/cn";

/**
 * 대시보드 구성 비교 — 검토용.
 *
 * 지금 /dashboard 는 `기록 표 하나 + 북마크 탭` 이 전부라 대시보드라기보다
 * 목록 페이지에 가깝다. 들어오자마자 "내가 본 것 중 무엇이 위험한가" 에
 * 답하는 화면이 되려면 구성부터 달라져야 하므로, 네 안을 같은 데이터로
 * 그려 놓고 고른다.
 *
 * 넷 다 랜딩과 같은 언어를 쓴다 — 토큰, Pretendard, 판정 3색, 괘선.
 * 지금 대시보드가 자체 팔레트와 자체 CSS 로 따로 노는 것이 문제의 절반이다.
 *
 * 등급도 5단계를 새로 만들지 않고 판정 3색에 얹었다. 서비스 전체가
 * `확인 / 부분 / 없음` 셋으로만 말하기로 한 이상 대시보드만 다섯 단계를
 * 쓸 이유가 없다.
 */

export const metadata = { title: "Fides — 대시보드 구성 비교" };

type Risk = "high" | "medium" | "low";

const RISK: Record<Risk, { label: string; color: string; soft: string }> = {
  high: { label: "High", color: "var(--color-missing)", soft: "var(--color-missing-soft)" },
  medium: { label: "Medium", color: "var(--color-partial)", soft: "var(--color-partial-soft)" },
  low: { label: "Low", color: "var(--color-verified)", soft: "var(--color-verified-soft)" },
};

interface Row {
  id: number;
  product: string;
  company: string;
  category: string;
  accs: number;
  risk: Risk;
  claims: { total: number; verified: number; partial: number; missing: number };
  axes: { text: number; verification: number; relational: number };
  date: string;
  trend: number[];
  watched?: boolean;
}

const ROWS: Row[] = [
  {
    id: 1, product: "AI 절약 세탁기 21kg", company: "OO전자", category: "세탁기",
    accs: 31, risk: "high",
    claims: { total: 6, verified: 1, partial: 1, missing: 4 },
    axes: { text: 42, verification: 18, relational: 35 },
    date: "2026.08.14", trend: [58, 52, 47, 39, 31], watched: true,
  },
  {
    id: 2, product: "QNED AI 75형", company: "OO전자", category: "TV",
    accs: 54, risk: "medium",
    claims: { total: 5, verified: 2, partial: 2, missing: 1 },
    axes: { text: 61, verification: 44, relational: 58 },
    date: "2026.08.13", trend: [49, 51, 53, 52, 54], watched: true,
  },
  {
    id: 3, product: "올인원 로봇청소기", company: "OO로보틱스", category: "로봇청소기",
    accs: 82, risk: "low",
    claims: { total: 4, verified: 4, partial: 0, missing: 0 },
    axes: { text: 78, verification: 91, relational: 76 },
    date: "2026.08.13", trend: [80, 81, 79, 82, 82],
  },
  {
    id: 4, product: "냉기케어 냉장고 870L", company: "OO전자", category: "냉장고",
    accs: 38, risk: "high",
    claims: { total: 7, verified: 1, partial: 2, missing: 4 },
    axes: { text: 50, verification: 24, relational: 41 },
    date: "2026.08.11", trend: [44, 43, 40, 38, 38], watched: true,
  },
  {
    id: 5, product: "AI 매직 리모컨 세트", company: "OO전자", category: "TV 액세서리",
    accs: 47, risk: "medium",
    claims: { total: 3, verified: 1, partial: 1, missing: 1 },
    axes: { text: 55, verification: 38, relational: 49 },
    date: "2026.08.09", trend: [47, 47, 47, 47, 47],
  },
  {
    id: 6, product: "인버터 에어컨 18평", company: "OO공조", category: "에어컨",
    accs: 69, risk: "low",
    claims: { total: 5, verified: 3, partial: 2, missing: 0 },
    axes: { text: 70, verification: 72, relational: 64 },
    date: "2026.08.07", trend: [65, 66, 68, 69, 69],
  },
];

const missingRate = (r: Row) => Math.round((r.claims.missing / r.claims.total) * 100);

/* ══ 조각 ═══════════════════════════════════════════════════════════ */

function RiskTag({ risk }: { risk: Risk }) {
  const r = RISK[risk];
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-xs tracking-[var(--tracking-label)]"
      style={{ color: r.color }}
    >
      <span className="size-[5px] shrink-0 rounded-full" style={{ background: r.color }} />
      {r.label}
    </span>
  );
}

/** 주장 6개 중 근거가 붙은 것과 끊긴 것을 칸으로 보여준다 */
function ClaimBar({ claims }: { claims: Row["claims"] }) {
  const seg = [
    { n: claims.verified, c: "var(--color-verified)" },
    { n: claims.partial, c: "var(--color-partial)" },
    { n: claims.missing, c: "var(--color-missing)" },
  ];
  return (
    <span className="flex gap-[3px]">
      {seg.flatMap((s, si) =>
        Array.from({ length: s.n }).map((_, i) => (
          <span
            key={`${si}-${i}`}
            className="h-[6px] w-[10px] rounded-[1px]"
            style={{ background: s.c, opacity: si === 2 ? 1 : 0.55 }}
          />
        )),
      )}
    </span>
  );
}

function Spark({ points, risk }: { points: number[]; risk: Risk }) {
  const w = 62, h = 20;
  const min = Math.min(...points), max = Math.max(...points);
  const span = Math.max(1, max - min);
  const d = points
    .map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p - min) / span) * (h - 4) - 2}`)
    .join(" ");
  return (
    <svg width={w} height={h} aria-hidden className="overflow-visible">
      <polyline points={d} fill="none" stroke={RISK[risk].color} strokeWidth="1.4" />
      <circle
        cx={w}
        cy={h - ((points[points.length - 1] - min) / span) * (h - 4) - 2}
        r="2"
        fill={RISK[risk].color}
      />
    </svg>
  );
}

function Score({ v, size = "md" }: { v: number; size?: "md" | "lg" }) {
  const risk: Risk = v < 45 ? "high" : v < 65 ? "medium" : "low";
  return (
    <span
      className={cn("tnum font-medium", size === "lg" ? "text-[34px] leading-none" : "text-sm")}
      style={{ color: RISK[risk].color, letterSpacing: size === "lg" ? "var(--tracking-display)" : undefined }}
    >
      {v}
    </span>
  );
}

const LABEL = "font-mono text-xs tracking-[var(--tracking-label)] text-fg-faint";

/* ══ A · 요약 우선 ═══════════════════════════════════════════════════ */

function VariantA() {
  const high = ROWS.filter((r) => r.risk === "high");
  const avgMissing = Math.round(ROWS.reduce((s, r) => s + missingRate(r), 0) / ROWS.length);

  return (
    <div>
      {/* 요약 지표 */}
      <div className="border-border grid grid-cols-2 gap-x-8 gap-y-6 border-y py-6 md:grid-cols-4">
        {[
          { k: "분석한 제품", v: String(ROWS.length), sub: "최근 30일" },
          { k: "근거 부재율 평균", v: `${avgMissing}%`, sub: "주장 대비", tone: "missing" },
          { k: "High Risk", v: String(high.length), sub: "즉시 확인 필요", tone: "missing" },
          { k: "워치리스트", v: String(ROWS.filter((r) => r.watched).length), sub: "재검증 추적 중" },
        ].map((s) => (
          <div key={s.k}>
            <p className={LABEL}>{s.k}</p>
            <p
              className="tnum mt-2 text-[30px] leading-none font-medium tracking-[var(--tracking-display)]"
              style={{ color: s.tone === "missing" ? "var(--color-missing)" : "var(--color-fg)" }}
            >
              {s.v}
            </p>
            <p className="text-fg-dim mt-2 text-xs">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* 지금 봐야 할 것 */}
      <div className="mt-10">
        <h3 className="text-fg text-[17px] font-medium tracking-[var(--tracking-tight)]">
          지금 봐야 할 것
        </h3>
        <p className="text-fg-dim mt-1.5 text-xs">근거가 끊긴 주장이 가장 많은 순서입니다.</p>
        <ul className="border-border divide-border mt-4 divide-y border-y">
          {[...ROWS].sort((a, b) => missingRate(b) - missingRate(a)).slice(0, 3).map((r) => (
            <li key={r.id} className="flex items-center gap-5 py-4">
              <span className="min-w-0 flex-1">
                <span className="text-fg block text-sm font-medium tracking-[var(--tracking-tight)]">
                  {r.product}
                </span>
                <span className="text-fg-dim mt-0.5 block text-xs">{r.company}</span>
              </span>
              <ClaimBar claims={r.claims} />
              <span className="text-fg-dim tnum w-[92px] text-right text-xs">
                근거 부재 <span style={{ color: "var(--color-missing)" }}>{missingRate(r)}%</span>
              </span>
              <span className="w-[70px] text-right"><RiskTag risk={r.risk} /></span>
            </li>
          ))}
        </ul>
      </div>

      {/* 전체 기록 */}
      <div className="mt-10">
        <h3 className="text-fg text-[17px] font-medium tracking-[var(--tracking-tight)]">
          분석 기록
        </h3>
        <table className="mt-4 w-full table-fixed border-collapse">
          <thead>
            <tr className="border-border border-b">
              <th className={cn(LABEL, "w-[38%] pb-3 text-left font-normal")}>제품</th>
              <th className={cn(LABEL, "w-[16%] pb-3 text-left font-normal")}>카테고리</th>
              <th className={cn(LABEL, "w-[14%] pb-3 text-left font-normal")}>주장 · 근거</th>
              <th className={cn(LABEL, "w-[12%] pb-3 text-right font-normal")}>ACCS</th>
              <th className={cn(LABEL, "w-[10%] pb-3 text-right font-normal")}>판정</th>
              <th className={cn(LABEL, "w-[10%] pb-3 text-right font-normal")}>분석일</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.id} className="border-border border-b">
                <td className="py-3.5">
                  <span className="text-fg block text-sm tracking-[var(--tracking-tight)]">
                    {r.product}
                  </span>
                  <span className="text-fg-dim mt-0.5 block text-xs">{r.company}</span>
                </td>
                <td className="text-fg-dim py-3.5 text-xs">{r.category}</td>
                <td className="py-3.5"><ClaimBar claims={r.claims} /></td>
                <td className="py-3.5 text-right"><Score v={r.accs} /></td>
                <td className="py-3.5 text-right"><RiskTag risk={r.risk} /></td>
                <td className="text-fg-dim tnum py-3.5 text-right text-xs">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══ B · 워치리스트 · 추적 중심 ══════════════════════════════════════ */

function VariantB() {
  const watched = ROWS.filter((r) => r.watched);
  const rest = ROWS.filter((r) => !r.watched);

  return (
    <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div>
        <h3 className="text-fg text-[17px] font-medium tracking-[var(--tracking-tight)]">
          추적 중
        </h3>
        <p className="text-fg-dim mt-1.5 text-xs">
          등록한 제품은 재검증할 때마다 점수를 다시 기록합니다. 선이 내려가면
          근거가 사라진 것입니다.
        </p>

        <ul className="border-border divide-border mt-5 divide-y border-y">
          {watched.map((r) => {
            const delta = r.trend[r.trend.length - 1] - r.trend[0];
            return (
              <li key={r.id} className="py-5">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-fg text-sm font-medium tracking-[var(--tracking-tight)]">
                      {r.product}
                    </p>
                    <p className="text-fg-dim mt-0.5 text-xs">
                      {r.company} · {r.category}
                    </p>
                  </div>
                  <Spark points={r.trend} risk={r.risk} />
                  <div className="w-[86px] text-right">
                    <Score v={r.accs} />
                    <p
                      className="tnum mt-0.5 text-xs"
                      style={{
                        color: delta < 0 ? "var(--color-missing)" : "var(--color-fg-dim)",
                      }}
                    >
                      {delta > 0 ? "+" : ""}
                      {delta} (5회)
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <ClaimBar claims={r.claims} />
                  <span className="text-fg-dim text-xs">
                    주장 {r.claims.total} · 근거 없음{" "}
                    <span style={{ color: "var(--color-missing)" }}>{r.claims.missing}</span>
                  </span>
                  <span className="ml-auto"><RiskTag risk={r.risk} /></span>
                </div>
              </li>
            );
          })}
        </ul>

        <button className="border-border text-fg-dim mt-5 w-full rounded-[var(--radius-input)] border border-dashed py-3 text-xs">
          + 제품 URL 로 추적 추가
        </button>
      </div>

      <div>
        <h3 className="text-fg text-[17px] font-medium tracking-[var(--tracking-tight)]">
          최근 분석
        </h3>
        <p className="text-fg-dim mt-1.5 text-xs">추적하지 않는 일회성 기록입니다.</p>
        <ul className="border-border divide-border mt-5 divide-y border-y">
          {rest.map((r) => (
            <li key={r.id} className="flex items-center gap-4 py-4">
              <span className="min-w-0 flex-1">
                <span className="text-fg block text-sm tracking-[var(--tracking-tight)]">
                  {r.product}
                </span>
                <span className="text-fg-dim mt-0.5 block text-xs">{r.date}</span>
              </span>
              <Score v={r.accs} />
              <button className="text-fg-faint text-xs">추적 +</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ══ C · 위험 보드 ═══════════════════════════════════════════════════ */

function VariantC() {
  const cols: { risk: Risk; note: string }[] = [
    { risk: "high", note: "근거가 절반 넘게 끊겼습니다" },
    { risk: "medium", note: "일부만 대조됐습니다" },
    { risk: "low", note: "주장 대부분이 기록으로 확인됩니다" },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {cols.map((c) => {
        const items = ROWS.filter((r) => r.risk === c.risk);
        return (
          <section key={c.risk}>
            <div
              className="flex items-baseline justify-between border-t pt-4"
              style={{ borderColor: RISK[c.risk].color }}
            >
              <RiskTag risk={c.risk} />
              <span className="tnum text-fg-dim text-xs">{items.length}</span>
            </div>
            <p className="text-fg-dim mt-2 text-xs">{c.note}</p>

            <ul className="mt-4 flex flex-col gap-2.5">
              {items.map((r) => (
                <li
                  key={r.id}
                  className="rounded-[var(--radius-tile)] p-4"
                  style={{ background: RISK[c.risk].soft }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-fg text-sm font-medium tracking-[var(--tracking-tight)]">
                      {r.product}
                    </p>
                    <Score v={r.accs} />
                  </div>
                  <p className="text-fg-dim mt-1 text-xs">
                    {r.company} · {r.category}
                  </p>
                  <div className="mt-3"><ClaimBar claims={r.claims} /></div>
                  <p className="text-fg-dim mt-2.5 text-xs">
                    주장 {r.claims.total} 중 근거 없음{" "}
                    <span style={{ color: "var(--color-missing)" }}>{r.claims.missing}</span>
                  </p>
                </li>
              ))}
              {items.length === 0 && (
                <li className="text-fg-faint py-6 text-center text-xs">없음</li>
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/* ══ D · 밀집 표 + 인라인 확장 ═══════════════════════════════════════ */

function VariantD() {
  const open = ROWS[0];

  return (
    <div>
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="border-border border-b">
            <th className={cn(LABEL, "w-[30%] pb-3 text-left font-normal")}>제품</th>
            <th className={cn(LABEL, "w-[13%] pb-3 text-left font-normal")}>카테고리</th>
            <th className={cn(LABEL, "w-[14%] pb-3 text-left font-normal")}>주장 · 근거</th>
            <th className={cn(LABEL, "w-[11%] pb-3 text-right font-normal")}>텍스트</th>
            <th className={cn(LABEL, "w-[11%] pb-3 text-right font-normal")}>검증</th>
            <th className={cn(LABEL, "w-[11%] pb-3 text-right font-normal")}>관계형</th>
            <th className={cn(LABEL, "w-[10%] pb-3 text-right font-normal")}>ACCS</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <Fragment key={r.id}>
              <tr className={cn("border-border border-b", r.id === open.id && "bg-surface")}>
                <td className="py-3">
                  <span className="text-fg text-sm tracking-[var(--tracking-tight)]">
                    {r.product}
                  </span>
                  <span className="text-fg-dim ml-2 text-xs">{r.company}</span>
                </td>
                <td className="text-fg-dim py-3 text-xs">{r.category}</td>
                <td className="py-3"><ClaimBar claims={r.claims} /></td>
                <td className="tnum text-fg-muted py-3 text-right text-xs">{r.axes.text}</td>
                <td className="tnum text-fg-muted py-3 text-right text-xs">{r.axes.verification}</td>
                <td className="tnum text-fg-muted py-3 text-right text-xs">{r.axes.relational}</td>
                <td className="py-3 text-right"><Score v={r.accs} /></td>
              </tr>

              {/* 펼친 행 — 실제 구현에서는 클릭으로 토글한다 */}
              {r.id === open.id && (
                <tr className="border-border bg-surface border-b">
                  <td colSpan={7} className="px-1 pt-1 pb-6">
                    <div className="grid grid-cols-1 gap-x-12 gap-y-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                      <div>
                        <p className={LABEL}>3축 신뢰도</p>
                        <ul className="mt-3 flex flex-col gap-2.5">
                          {[
                            ["텍스트 신뢰도", r.axes.text],
                            ["검증 신뢰도", r.axes.verification],
                            ["관계형 신뢰도", r.axes.relational],
                          ].map(([k, v]) => (
                            <li key={k as string} className="flex items-center gap-3">
                              <span className="text-fg-dim w-[86px] shrink-0 text-xs">{k}</span>
                              <span className="bg-border h-[3px] flex-1 overflow-hidden rounded-full">
                                <span
                                  className="block h-full rounded-full"
                                  style={{
                                    width: `${v}%`,
                                    background:
                                      (v as number) < 45
                                        ? "var(--color-missing)"
                                        : (v as number) < 65
                                          ? "var(--color-partial)"
                                          : "var(--color-verified)",
                                  }}
                                />
                              </span>
                              <span className="tnum text-fg-muted w-7 text-right text-xs">{v}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className={LABEL}>근거가 끊긴 주장</p>
                        <ul className="border-border divide-border mt-3 divide-y border-t">
                          {["에너지 절약 자동 제어", "AI 세탁 코스 추천", "때 인식 센서", "자동 세제 투입 최적화"].map(
                            (c) => (
                              <li key={c} className="flex items-center justify-between py-2">
                                <span className="text-fg text-xs">{c}</span>
                                <span
                                  className="font-mono text-xs tracking-[var(--tracking-label)]"
                                  style={{ color: "var(--color-missing)" }}
                                >
                                  근거 미확인
                                </span>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ══ 페이지 ══════════════════════════════════════════════════════════ */

const VARIANTS = [
  {
    no: "A",
    name: "요약 우선",
    says: "요약 지표 → 지금 봐야 할 것 → 전체 기록. 들어오자마자 '무엇이 위험한가'에 답합니다. 대시보드의 정석이고, 지금 표에 없는 근거 부재율을 앞으로 끌어냅니다.",
    cost: "화면이 길어지고, 기록이 몇 건 없는 초기 사용자에게는 지표가 다 0이라 허전합니다.",
    render: <VariantA />,
  },
  {
    no: "B",
    name: "추적 중심",
    says: "워치리스트를 메인에 두고 재검증할 때마다 점수 변화를 스파크라인으로 남깁니다. '선이 내려가면 근거가 사라진 것' — 이 제품이 시간에 대해 할 수 있는 유일한 말이고, 지금 화면에는 없습니다.",
    cost: "재검증 이력이 쌓여야 값을 합니다. 한 번만 분석한 제품은 점 하나뿐입니다.",
    render: <VariantB />,
  },
  {
    no: "C",
    name: "위험 보드",
    says: "High / Medium / Low 세 열로 나눠 칸반처럼 늘어놓습니다. 훑기가 가장 빠르고 판정 3색이 레이아웃 자체가 됩니다.",
    cost: "카드라 밀도가 낮아 기록이 늘면 스크롤이 길어집니다. 정렬·검색과 궁합이 나쁩니다.",
    render: <VariantC />,
  },
  {
    no: "D",
    name: "밀집 표 + 인라인 확장",
    says: "3축 신뢰도까지 표에 다 펴고, 행을 누르면 그 자리에서 끊긴 주장이 펼쳐집니다. 페이지 이동 없이 끝까지 봅니다. 지금 구조와 가장 가깝습니다.",
    cost: "정보 밀도가 높아 처음 보는 사람에게는 벽처럼 보입니다. 좁은 화면에서 열이 넘칩니다.",
    render: <VariantD />,
  },
];

export default function DashboardPreview() {
  return (
    <main className="bg-bg min-h-dvh pb-24">
      <div className="mx-auto w-full max-w-[1200px] px-5 pt-16 md:px-10">
        <p className={LABEL}>PREVIEW</p>
        <h1 className="text-fg mt-3 text-2xl font-medium tracking-[var(--tracking-heading)] md:text-[27px]">
          대시보드 — 구성 네 가지
        </h1>
        <p className="text-fg-dim mt-4 max-w-[760px] text-xs leading-loose">
          같은 샘플 데이터로 그렸습니다. 넷 다 랜딩과 같은 언어를 씁니다 —
          토큰, Pretendard, 판정 3색, 괘선. 지금 대시보드가 자체 팔레트와 자체
          CSS 로 따로 노는 것이 문제의 절반입니다. 등급도 5단계를 새로 만들지
          않고 <strong className="text-fg font-medium">확인 · 부분 · 없음</strong> 셋에 얹었습니다.
        </p>
      </div>

      <div className="mt-14 flex flex-col gap-20">
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
            <div className="mt-8">{v.render}</div>
          </section>
        ))}
      </div>
    </main>
  );
}
