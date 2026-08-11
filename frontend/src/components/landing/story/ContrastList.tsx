import { cn } from "@/lib/cn";

/**
 * 차별성 — 기존 도구와 본 프로젝트를 나란히 놓는다.
 *
 * "우리는 다르다"를 형용사로 말하면 아무 설득력이 없다. 기존이 무엇을
 * 했는지 먼저 적고 그 옆에 우리를 놓아야 차이가 보인다.
 *
 * 대비를 색으로도 준다 — 기존은 흐리게, 본 프로젝트는 브랜드 색으로.
 */

export interface Contrast {
  axis: string;
  title: string;
  before: string;
  after: string;
}

export function ContrastList({
  items,
  className,
}: {
  items: Contrast[];
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {items.map((item, i) => (
        <li
          key={item.axis}
          className={cn(
            "border-border grid grid-cols-1 gap-x-8 gap-y-3 border-t py-5 md:grid-cols-[150px_1fr]",
            i === items.length - 1 && "border-b",
          )}
        >
          <div>
            <p className="text-fg-faint font-mono text-xs tracking-[var(--tracking-label)]">
              {String(i + 1).padStart(2, "0")}
            </p>
            <p className="text-fg-subtle mt-1.5 text-xs">{item.axis}</p>
          </div>

          <div>
            <h3 className="text-fg text-[17px] font-medium tracking-[var(--tracking-tight)]">
              {item.title}
            </h3>
            <dl className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="bg-surface-strong rounded-[var(--radius-input)] px-3.5 py-2.5">
                <dt className="text-fg-faint font-mono text-xs">기존</dt>
                <dd className="text-fg-dim mt-1 text-xs leading-relaxed">
                  {item.before}
                </dd>
              </div>
              <div
                className="rounded-[var(--radius-input)] px-3.5 py-2.5"
                style={{ background: "var(--color-brand-soft)" }}
              >
                <dt
                  className="font-mono text-xs"
                  style={{ color: "var(--color-brand-fg)" }}
                >
                  Fides
                </dt>
                <dd className="text-fg-muted mt-1 text-xs leading-relaxed">
                  {item.after}
                </dd>
              </div>
            </dl>
          </div>
        </li>
      ))}
    </ol>
  );
}
