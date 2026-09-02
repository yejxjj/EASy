"use client";

import { createAnimatable } from "animejs";
import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * 계단식으로 어긋난 2열 카드 그리드.
 *
 * 우측 열만 아래로 밀어 정렬을 깬다. 격자에 딱 맞춘 그리드보다 리듬이
 * 살고, 이 디자인에서 가장 특징적인 배치다.
 *
 * 한 열로 접히는 좁은 화면에서는 오프셋을 없앤다 — 세로로 쌓인 상태에서
 * 어긋나면 그냥 잘못 정렬된 것처럼 보인다.
 */

export interface StaggeredCardsProps {
  children: ReactNode[];
  /** 우측 열을 밀어내는 거리 (px) */
  offset?: number;
  className?: string;
}

export function StaggeredCards({
  children,
  offset = 26,
  className,
}: StaggeredCardsProps) {
  return (
    <div
      className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}
      style={{ ["--stagger" as string]: `${offset}px` }}
    >
      {children.map((child, i) => (
        <div key={i} className={i % 2 === 1 ? "sm:mt-[var(--stagger)]" : undefined}>
          {child}
        </div>
      ))}
    </div>
  );
}

const GLOW_POSITION = {
  br: "-right-6 -bottom-6",
  tr: "-right-6 -top-6",
  bl: "-left-5 -bottom-7",
  none: "hidden",
} as const;

/** 반사광의 지름. 중심을 커서에 맞추려면 절반만큼 되빼야 한다. */
const SPEC = 200;

/**
 * 계단식 그리드에 들어가는 파란 타일.
 * 우하단 화살표가 "누를 수 있다"는 신호를 준다.
 *
 * 손을 대면 카드가 그쪽으로 기운다. 커서 위치를 카드 중심 기준으로
 * 정규화해 rotateX/rotateY 로 옮기고, 같은 자리에 흰 반사광을 띄운다 —
 * 금속판을 기울일 때 광원이 미끄러지는 모양이다. 페이지 전체가 좌상단
 * 광원을 전제로 하므로(ChromeObject 와 같은 규칙) 반사광만 커서를 따르고
 * 카드의 고정 글로우는 그대로 둔다.
 *
 * 기울기·반사광·화살표를 각각 다른 시간으로 좇게 해서 손보다 살짝
 * 늦게 따라오게 했다. 정확히 같이 움직이면 붙어 있는 스티커처럼 보인다.
 *
 * `createAnimatable` 을 쓰는 이유: pointermove 는 초당 수십 번 들어오는데
 * 그때마다 새 애니메이션을 만들면 큐가 쌓인다. 애니메이터블은 목표값만
 * 갈아끼우고 렌더는 한 곳에서 돈다.
 */
export function GradientTile({
  eyebrow,
  title,
  description,
  deep,
  glowCorner = "br",
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  /** 가장 어두운 변형 — 네 장을 나란히 둘 때 마지막 장에 쓴다 */
  deep?: boolean;
  glowCorner?: keyof typeof GLOW_POSITION;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const specRef = useRef<HTMLSpanElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const spec = specRef.current;
    const arrow = arrowRef.current;
    if (!card || !spec || !arrow) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tilt = createAnimatable(card, {
      rotateX: { duration: 420, ease: "out(3)" },
      rotateY: { duration: 420, ease: "out(3)" },
      scale: { duration: 420, ease: "out(3)" },
    });
    const light = createAnimatable(spec, {
      translateX: { duration: 560, ease: "out(3)" },
      translateY: { duration: 560, ease: "out(3)" },
      opacity: { duration: 380, ease: "out(2)" },
    });
    const nudge = createAnimatable(arrow, {
      translateX: { duration: 380, ease: "out(3)" },
    });

    const onMove = (e: PointerEvent) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      tilt.rotateY((x / r.width - 0.5) * 9);
      tilt.rotateX((0.5 - y / r.height) * 9);
      tilt.scale(1.02);
      light.translateX(x - SPEC / 2);
      light.translateY(y - SPEC / 2);
      light.opacity(1);
      nudge.translateX(5);
    };

    const onLeave = () => {
      tilt.rotateX(0);
      tilt.rotateY(0);
      tilt.scale(1);
      light.opacity(0);
      nudge.translateX(0);
    };

    /* 터치는 기울기를 읽을 수 없다. 눌린 느낌만 준다. */
    const onDown = () => tilt.scale(0.98);
    const onUp = () => tilt.scale(1);

    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", onLeave);
    card.addEventListener("pointercancel", onLeave);
    card.addEventListener("pointerdown", onDown);
    card.addEventListener("pointerup", onUp);

    return () => {
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerleave", onLeave);
      card.removeEventListener("pointercancel", onLeave);
      card.removeEventListener("pointerdown", onDown);
      card.removeEventListener("pointerup", onUp);
      tilt.revert();
      light.revert();
      nudge.revert();
    };
  }, []);

  return (
    /* 원근은 바깥에 둔다. 카드 자신에게 걸면 기울기와 같은 transform 을
       두고 anime 와 다투게 된다. */
    <div className="h-full" style={{ perspective: "760px" }}>
      <article
        ref={cardRef}
        className="relative flex h-full min-h-[152px] flex-col justify-between overflow-hidden rounded-[var(--radius-tile)] p-4 text-white will-change-transform"
        style={{
          background: deep ? "var(--gradient-tile-deep)" : "var(--gradient-tile)",
        }}
      >
        {/* 고정 글로우 — 카드마다 다른 모서리에 둔다 */}
        <span
          aria-hidden
          className={cn(
            "absolute size-[88px] rounded-full",
            GLOW_POSITION[glowCorner],
          )}
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,.17), transparent 66%)",
          }}
        />

        {/* 커서를 따라다니는 반사광 */}
        <span
          ref={specRef}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 rounded-full opacity-0"
          style={{
            width: SPEC,
            height: SPEC,
            background:
              "radial-gradient(circle, rgba(255,255,255,.30), transparent 62%)",
          }}
        />

        <div className="relative">
          <p className="font-mono text-xs text-white/65">{eyebrow}</p>
          <h3 className="mt-2.5 text-[15px] font-medium tracking-[var(--tracking-tight)]">
            {title}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-white/75">
            {description}
          </p>
        </div>

        <span
          ref={arrowRef}
          aria-hidden
          className="relative mt-3 self-end text-sm text-white/85"
        >
          →
        </span>
      </article>
    </div>
  );
}
