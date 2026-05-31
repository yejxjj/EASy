import { dimensionTextClass, type Dimension } from "@/lib/score";

interface Stat {
  label: string;
  value: string;
  caption: string;
  dim: Dimension | "brand";
}

const STATS: Stat[] = [
  { label: "analysis pipeline", value: "6", caption: "단계 (크롤 → 스코어)", dim: "brand" },
  {
    label: "public data sources",
    value: "4+",
    caption: "전파인증 · 조달청 · TIPA · KORAIA",
    dim: "verify",
  },
  {
    label: "patent · cert db",
    value: "3",
    caption: "KIPRIS · GS · NEP",
    dim: "relational",
  },
  { label: "avg analysis time", value: "~18s", caption: "mock 기준", dim: "text" },
];

export function StatsBar() {
  return (
    <section
      aria-label="서비스 개요 통계"
      className="border-border bg-surface mx-auto max-w-7xl border-y px-6 py-8"
    >
      <dl className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
        {STATS.map((s) => {
          const valueClass =
            s.dim === "brand" ? "text-fg" : dimensionTextClass(s.dim);
          return (
            <div
              key={s.label}
              className="group flex flex-col gap-1.5 transition-colors"
            >
              <dt className="mono-eyebrow">{s.label}</dt>
              <dd
                className={`text-3xl font-bold tracking-tight tabular-nums transition-colors ${valueClass}`}
              >
                {s.value}
              </dd>
              <p className="text-fg-muted text-xs">{s.caption}</p>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
