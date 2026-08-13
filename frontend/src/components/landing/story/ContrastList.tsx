import { cn } from "@/lib/cn";

/**
 * 차별성 — 기존 도구와 본 프로젝트를 나란히 놓는다.
 *
 * "우리는 다르다"를 형용사로 말하면 아무 설득력이 없다. 기존이 무엇을
 * 했는지 먼저 적고 그 옆에 우리를 놓아야 차이가 보인다.
 *
 * 두 항목을 상자에 담지 않는다. 왼쪽은 흐린 글자, 오른쪽은 브랜드색
 * 세로 괘선과 진한 글자 — 색과 무게만으로 충분히 갈린다. 상자를 두르면
 * 대비보다 상자가 먼저 보인다.
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
    <ol className={cn("border-border divide-border divide-y border-y", className)}>
      {items.map((item, i) => (
        <li
          key={item.axis}
          className="grid grid-cols-1 gap-x-10 gap-y-4 py-6 md:grid-cols-[150px_1fr]"
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

            <dl className="mt-4 grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="text-fg-faint font-mono text-xs tracking-[var(--tracking-label)]">
                  기존
                </dt>
                <dd className="text-fg-dim mt-1.5 text-xs leading-relaxed">
                  {item.before}
                </dd>
              </div>

              <div
                className="border-l pl-4"
                style={{ borderColor: "var(--color-brand-fg)" }}
              >
                <dt
                  className="font-mono text-xs tracking-[var(--tracking-label)]"
                  style={{ color: "var(--color-brand-fg)" }}
                >
                  FIDES
                </dt>
                <dd className="text-fg-muted mt-1.5 text-xs leading-relaxed">
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
