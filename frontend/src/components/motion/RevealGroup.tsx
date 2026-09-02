"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * 섹션에 들어올 때 자식들을 순차적으로 드러낸다.
 *
 * 자식마다 컴포넌트를 감싸면 페이지가 지저분해지므로, 그룹 하나에만
 * 붙이고 지연은 CSS 의 nth-child 로 준다 (globals.css 의 `.reveal-group`).
 *
 * 한 번 나타난 뒤에는 관찰을 끊는다 — 스냅 스크롤로 위아래를 오갈 때마다
 * 다시 사라졌다 나타나면 멀미가 난다.
 *
 * JS 가 없으면 아무것도 안 보이므로 layout 에 noscript 예외를 둔다.
 * `prefers-reduced-motion` 에서는 globals.css 가 숨김 자체를 해제한다.
 */
export function RevealGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add("is-in");
        io.disconnect();
      },
      { threshold: 0.15 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("reveal-group", className)}>
      {children}
    </div>
  );
}
