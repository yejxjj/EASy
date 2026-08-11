import { cn } from "@/lib/cn";

/**
 * 3단계 처리 흐름.
 *
 * 발표 자료의 화살표 도형을 옮긴 것이다. 다만 화살표를 CSS clip-path 로
 * 흉내 내는 대신 번호와 구분선으로 순서를 표현했다 — 화살표 도형은
 * 좁은 화면에서 글자를 잘라먹는다.
 */

export interface Step {
  title: string;
  items: string[];
}

export function StepFlow({
  steps,
  className,
}: {
  steps: Step[];
  className?: string;
}) {
  return (
    <ol className={cn("grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-4", className)}>
      {steps.map((step, i) => (
        <li
          key={step.title}
          className="border-border relative border-t pt-5 md:pr-4"
        >
          <span
            className="tnum absolute -top-px left-0 h-[2px] w-9"
            style={{ background: "var(--color-brand-fg)" }}
            aria-hidden
          />
          <p className="text-fg-faint font-mono text-xs tracking-[var(--tracking-label)]">
            STEP {String(i + 1).padStart(2, "0")}
          </p>
          <h3 className="text-fg mt-2 text-[17px] font-medium tracking-[var(--tracking-tight)]">
            {step.title}
          </h3>
          <ul className="mt-3.5 flex flex-col gap-2">
            {step.items.map((item) => (
              <li key={item} className="text-fg-dim flex gap-2 text-xs leading-relaxed">
                <span
                  aria-hidden
                  className="mt-[7px] size-1 shrink-0 rounded-full"
                  style={{ background: "var(--color-brand-fg)" }}
                />
                {item}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
