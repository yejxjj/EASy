import { type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/**
 * 섹션 상단의 작은 모노 라벨.
 *
 * 이 디자인은 "아주 작은 모노 라벨"과 "아주 큰 헤드라인" 두 극단만 쓴다.
 * 중간 크기를 늘리면 위계가 뭉개진다.
 */
export function Eyebrow({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-fg-dim font-mono text-xs tracking-[var(--tracking-label)] uppercase",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}
