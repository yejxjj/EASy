"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 화면에 들어오면 0에서 목표값까지 굴러 올라가는 숫자.
 *
 * 통계 섹션의 58 · 72 · 61 · 48 처럼 "얼마나 흔한가"를 말하는 수치에만
 * 쓴다. 모든 숫자를 굴리면 산만해진다.
 *
 * `prefers-reduced-motion` 에서는 곧바로 최종값을 보여준다 — 애니메이션을
 * 0.01ms 로 줄이는 CSS 트릭과 달리, JS 로 굴리는 값은 직접 건너뛰어야 한다.
 */
export function CountUp({
  value,
  durationMs = 900,
  className,
}: {
  value: number;
  durationMs?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();

        /* 모션 최소화 판단을 여기서 한다. effect 본문에서 setState 를 부르면
           연쇄 렌더가 되고(react-hooks/set-state-in-effect), 관찰 콜백 안은
           이미 비동기라 그 문제가 없다. 화면에 들어온 뒤 곧바로 최종값을
           보여주므로 동작은 이전과 같다. */
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setShown(value);
          return;
        }

        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / durationMs);
          // ease-out cubic — 끝에서 부드럽게 멈춘다
          setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))));
          if (progress < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );

    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, durationMs]);

  return (
    <span ref={ref} className={className}>
      {shown}
    </span>
  );
}
