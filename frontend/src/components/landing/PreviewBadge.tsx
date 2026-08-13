import Link from "next/link";

/**
 * 검토용 배지 — 지금 몇 칸짜리 안을 보고 있는지 알려주고 서로 오갈 수 있게 한다.
 *
 * 현재안(7칸)이 메인 랜딩이므로 배지는 축소안에만 붙인다.
 * 방향이 정해지면 /preview 라우트와 함께 지운다.
 */

const VARIANTS = [
  { count: 7, href: "/", note: "현재안" },
  { count: 6, href: "/preview/6", note: "축소안" },
] as const;

export function PreviewBadge({ count }: { count: 7 | 6 }) {
  return (
    <div className="fixed top-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-[var(--radius-pill)] bg-black/70 p-1 pl-3 font-mono text-xs text-white/70 backdrop-blur print:hidden">
      <span className="pr-1">검토용</span>
      {VARIANTS.map((v) => (
        <Link
          key={v.count}
          href={v.href}
          title={v.note}
          className={
            v.count === count
              ? "rounded-[var(--radius-pill)] bg-white px-2.5 py-1 text-black"
              : "rounded-[var(--radius-pill)] px-2.5 py-1 transition-colors hover:text-white"
          }
        >
          {v.count}칸
        </Link>
      ))}
    </div>
  );
}
