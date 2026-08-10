import { type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/**
 * 섹션 배경 전환.
 *
 * 라이트 → 다크 → 라이트 교차가 이 디자인의 리듬이다. 배경색을 매번
 * 손으로 적으면 금방 어긋나므로, 톤을 여기서만 정의한다.
 *
 * 다크 톤에서는 자식들이 쓸 전경색 변수도 같이 뒤집어 주기 때문에
 * `text-fg` / `text-fg-muted` 를 그대로 쓰면 알아서 밝은 색이 된다.
 */
export type SectionTone = "canvas" | "surface" | "ink" | "ink-soft" | "gradient";

const TONE_CLASSES: Record<SectionTone, string> = {
  canvas: "bg-bg text-fg",
  surface: "bg-surface text-fg",
  ink: "bg-ink text-fg-invert",
  "ink-soft": "bg-ink-soft text-fg-invert",
  gradient: "text-fg-invert [background:var(--gradient-hero)]",
};

/** 다크 면에서는 전경 토큰을 뒤집어 자식 컴포넌트가 그대로 동작하게 한다. */
const INVERTED: Partial<Record<SectionTone, string>> = {
  ink: "[--color-fg:var(--color-fg-invert)] [--color-fg-muted:var(--color-fg-invert-muted)] [--color-fg-subtle:var(--color-fg-invert-subtle)] [--color-fg-dim:var(--color-fg-invert-dim)] [--color-fg-faint:var(--color-fg-invert-dim)] [--color-border:var(--color-ink-border)]",
  "ink-soft": "[--color-fg:var(--color-fg-invert)] [--color-fg-muted:var(--color-fg-invert-muted)] [--color-fg-subtle:var(--color-fg-invert-subtle)] [--color-fg-dim:var(--color-fg-invert-dim)] [--color-fg-faint:var(--color-fg-invert-dim)] [--color-border:var(--color-ink-border)]",
  gradient:
    "[--color-fg:var(--color-fg-invert)] [--color-fg-muted:var(--color-fg-invert-muted)] [--color-fg-subtle:var(--color-fg-invert-subtle)] [--color-fg-dim:var(--color-fg-invert-dim)] [--color-fg-faint:var(--color-fg-invert-dim)] [--color-border:var(--color-ink-border)]",
};

interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone?: SectionTone;
  /** 좌우 여백과 최대 폭을 가진 내부 래퍼를 끈다 (풀블리드 배경이 필요할 때) */
  bare?: boolean;
  /** 위아래 여백을 줄인다 */
  compact?: boolean;
  /**
   * 한 화면을 꽉 채우고 스냅 지점이 된다.
   * 내용은 세로 가운데 정렬되며, 넘치면 섹션이 늘어난다 (잘리지 않는다).
   */
  full?: boolean;
  /**
   * 스냅 정렬 기준. 뷰포트보다 높아질 수 있는 섹션은 "end" 로 두어야
   * 낮은 화면에서 꼬리가 밖으로 밀려나지 않는다.
   */
  snapAlign?: "start" | "end";
}

export function Section({
  tone = "surface",
  bare,
  compact,
  full,
  snapAlign = "start",
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        full && "snap-section flex min-h-dvh flex-col justify-center",
        full && snapAlign === "end" && "snap-section-end",
        TONE_CLASSES[tone],
        INVERTED[tone],
        className,
      )}
      {...props}
    >
      {bare ? (
        children
      ) : (
        <div
          className={cn(
            "mx-auto w-full max-w-[1200px] px-5 md:px-10",
            full ? "py-16" : compact ? "py-10 md:py-14" : "py-14 md:py-24",
          )}
        >
          {children}
        </div>
      )}
    </section>
  );
}
