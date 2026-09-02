"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

/**
 * 섹션 인디케이터 — 점과 화살표.
 *
 * 시안의 캐러셀 컨트롤 자리이지만, 캐러셀이 없는데 컨트롤만 두면 가짜
 * 어포던스가 된다. 그래서 실제로 동작하게 만들었다 — 스냅 스크롤 페이지의
 * 현재 위치를 보여주고, 눌러서 이동한다.
 *
 * 흰 점은 히어로(다크) 위에서만 보이므로, 섹션 톤에 따라 색을 뒤집는다.
 */

export interface SectionNavItem {
  id: string;
  label: string;
  /** 해당 섹션 배경이 어두운가 — 점 색을 뒤집는 기준 */
  dark?: boolean;
}

export function SectionNav({ items }: { items: SectionNavItem[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const targets = items
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        // 화면을 가장 많이 차지한 섹션을 현재로 본다
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best) return;
        const idx = items.findIndex((s) => s.id === best.target.id);
        if (idx >= 0) setActive(idx);
      },
      { threshold: [0.25, 0.5, 0.75] },
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  function goTo(index: number) {
    const next = Math.max(0, Math.min(items.length - 1, index));
    document.getElementById(items[next].id)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }

  const onDark = items[active]?.dark ?? false;

  return (
    <nav
      aria-label="섹션 이동"
      className="fixed bottom-7 left-5 z-30 hidden items-center gap-3 md:left-10 md:flex print:hidden"
    >
      <ul className="flex items-center gap-2">
        {items.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => goTo(i)}
              aria-label={item.label}
              aria-current={i === active ? "true" : undefined}
              className={cn(
                "block size-[7px] rounded-full transition-opacity",
                onDark ? "bg-white" : "bg-fg",
                i === active ? "opacity-100" : "opacity-30 hover:opacity-60",
              )}
            />
          </li>
        ))}
      </ul>

      <span className={cn("flex items-center gap-2 text-sm", onDark ? "text-white/55" : "text-fg-dim")}>
        <button
          type="button"
          onClick={() => goTo(active - 1)}
          disabled={active === 0}
          aria-label="이전 섹션"
          className="transition-opacity hover:opacity-100 disabled:opacity-25"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => goTo(active + 1)}
          disabled={active === items.length - 1}
          aria-label="다음 섹션"
          className="transition-opacity hover:opacity-100 disabled:opacity-25"
        >
          ›
        </button>
      </span>
    </nav>
  );
}
