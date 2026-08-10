import { type ReactNode } from "react";

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

/**
 * 계단식 그리드에 들어가는 파란 타일.
 * 우하단 화살표가 "누를 수 있다"는 신호를 준다.
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
  return (
    <article
      className="relative flex h-full min-h-[152px] flex-col justify-between overflow-hidden rounded-[var(--radius-tile)] p-4 text-white"
      style={{
        background: deep ? "var(--gradient-tile-deep)" : "var(--gradient-tile)",
      }}
    >
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
      <div className="relative">
        <p className="font-mono text-xs text-white/65">{eyebrow}</p>
        <h3 className="mt-2.5 text-[15px] font-medium tracking-[var(--tracking-tight)]">
          {title}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-white/75">{description}</p>
      </div>
      <span aria-hidden className="relative mt-3 self-end text-sm text-white/85">
        →
      </span>
    </article>
  );
}
