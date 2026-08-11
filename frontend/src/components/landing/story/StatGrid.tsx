import { CountUp } from "@/components/motion/CountUp";
import { cn } from "@/lib/cn";

/**
 * 조사 수치를 막대와 함께 보여준다.
 *
 * 숫자만 나열하면 크기가 안 읽히고, 차트를 그리면 랜딩에서 과하다.
 * 값에 비례한 가로 막대 하나면 충분하다.
 *
 * 출처를 반드시 같이 적는다 — 근거를 요구하는 서비스가 자기 숫자의
 * 출처를 안 밝히면 앞뒤가 맞지 않는다.
 */

export interface Stat {
  value: number;
  unit?: string;
  label: string;
  caption: string;
  /** 위험을 나타내는 수치는 판정 색을 쓴다 */
  tone?: "brand" | "missing";
}

export function StatGrid({
  stats,
  source,
  className,
}: {
  stats: Stat[];
  source: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <ul className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
        {stats.map((stat) => {
          const color =
            stat.tone === "missing"
              ? "var(--color-missing)"
              : "var(--color-brand-fg)";
          return (
            <li key={stat.label}>
              <p className="text-fg-dim text-xs">{stat.label}</p>
              <p
                className="tnum mt-1.5 text-[34px] leading-none font-medium tracking-[var(--tracking-display)]"
                style={{ color }}
              >
                <CountUp value={stat.value} />
                <span className="text-fg-dim ml-0.5 text-lg">
                  {stat.unit ?? "%"}
                </span>
              </p>
              <div
                className="mt-3 h-[3px] w-full overflow-hidden rounded-full"
                style={{ background: "var(--color-border)" }}
              >
                <div
                  className="bar-fill h-full rounded-full"
                  style={{ width: `${stat.value}%`, background: color }}
                />
              </div>
              <p className="text-fg-dim mt-2.5 text-xs leading-relaxed">
                {stat.caption}
              </p>
            </li>
          );
        })}
      </ul>
      <p className={cn("text-fg-faint mt-7 font-mono text-xs")}>출처 — {source}</p>
    </div>
  );
}
