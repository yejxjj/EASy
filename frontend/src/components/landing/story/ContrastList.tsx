"use client";

import { animate, stagger, utils } from "animejs";
import { useEffect, useRef } from "react";

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
 *
 * 화면에 들어오면 오른쪽 괘선이 위에서 아래로 그어지고 Fides 쪽 문장이
 * 뒤따라 자리를 잡는다. 줄에 손을 올리면 기존 쪽이 물러나고 Fides 쪽만
 * 남는다 — 이 화면이 요구하는 동작이 바로 그 비교다.
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
  const rootRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const rules = Array.from(root.querySelectorAll<HTMLElement>("[data-rule]"));
    const afters = Array.from(root.querySelectorAll<HTMLElement>("[data-after]"));
    const befores = Array.from(
      root.querySelectorAll<HTMLElement>("[data-before]"),
    );

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      utils.set(rules, { scaleY: 1 });
      return;
    }

    utils.set(rules, { scaleY: 0 });

    /* ── 손을 올리면 기존 쪽이 물러난다 ─────────────────────────── */
    const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-row]"));
    const off: Array<() => void> = [];
    rows.forEach((row) => {
      const before = row.querySelector<HTMLElement>("[data-before]");
      const after = row.querySelector<HTMLElement>("[data-after]");
      const enter = () => {
        if (before) animate(before, { opacity: 0.3, duration: 260, ease: "out(2)" });
        if (after) animate(after, { translateX: 4, duration: 320, ease: "out(3)" });
      };
      const leave = () => {
        if (before) animate(before, { opacity: 1, duration: 240, ease: "out(2)" });
        if (after) animate(after, { translateX: 0, duration: 280, ease: "out(3)" });
      };
      row.addEventListener("pointerenter", enter);
      row.addEventListener("pointerleave", leave);
      off.push(() => {
        row.removeEventListener("pointerenter", enter);
        row.removeEventListener("pointerleave", leave);
      });
    });

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        animate(rules, {
          scaleY: [{ from: 0, to: 1 }],
          duration: 700,
          delay: stagger(170),
          ease: "out(3)",
        });
        animate(afters, {
          translateX: [{ from: -8, to: 0 }],
          opacity: [{ from: 0.35, to: 1 }],
          duration: 640,
          delay: stagger(170, { start: 120 }),
          ease: "out(3)",
        });
      },
      { threshold: 0.25 },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      off.forEach((fn) => fn());
      utils.remove([...rules, ...afters, ...befores]);
    };
  }, [items]);

  return (
    <ol
      ref={rootRef}
      className={cn("border-border divide-border divide-y border-y", className)}
    >
      {items.map((item, i) => (
        <li
          key={item.axis}
          data-row
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
              <div data-before>
                <dt className="text-fg-faint font-mono text-xs tracking-[var(--tracking-label)]">
                  기존
                </dt>
                <dd className="text-fg-dim mt-1.5 text-xs leading-relaxed">
                  {item.before}
                </dd>
              </div>

              {/* 괘선을 border 대신 요소로 둔다 — border 는 늘릴 수 없다 */}
              <div data-after className="relative pl-4">
                <span
                  data-rule
                  aria-hidden
                  className="contrast-rule absolute top-0 left-0 h-full w-px"
                  style={{ background: "var(--color-brand-fg)" }}
                />
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
