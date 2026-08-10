import Link from "next/link";

import { cn } from "@/lib/cn";

/**
 * Product & Report 섹션의 흰 카드.
 *
 * 좌상단의 작은 conic 원이 카드끼리를 구분하는 유일한 색 신호다.
 * 판정 3색과 겹치지 않게 별도 계열을 쓴다 — 여기에 verified/missing 색을
 * 쓰면 "이 기능이 검증됨"이라는 잘못된 의미가 생긴다.
 */

export type TileTone = "blue" | "coral" | "green" | "violet";

const TONE_ORB: Record<TileTone, string> = {
  blue: "conic-gradient(#2f7fe8, #8fe0f4, #0c3fcc, #2f7fe8)",
  coral: "conic-gradient(#ff8a5c, #ffd08a, #e8593d, #ff8a5c)",
  green: "conic-gradient(#1fb98a, #9ff0d4, #0a7a5c, #1fb98a)",
  violet: "conic-gradient(#7c5cff, #c4b4ff, #4a2fd8, #7c5cff)",
};

export interface IconTileProps {
  tone?: TileTone;
  title: string;
  description: string;
  href?: string;
  className?: string;
}

export function IconTile({
  tone = "blue",
  title,
  description,
  href,
  className,
}: IconTileProps) {
  const body = (
    <>
      <div>
        <span
          aria-hidden
          className="block size-6 rounded-full"
          style={{ background: TONE_ORB[tone] }}
        />
        <h3 className="text-fg mt-4 text-sm font-medium tracking-[var(--tracking-tight)]">
          {title}
        </h3>
        <p className="text-fg-dim mt-1.5 text-xs leading-relaxed whitespace-pre-line">
          {description}
        </p>
      </div>
      <span aria-hidden className="text-fg-faint mt-4 self-end text-sm">
        →
      </span>
    </>
  );

  const shell = cn(
    "bg-surface flex h-full min-h-[132px] flex-col justify-between rounded-[var(--radius-tile)] p-4",
    className,
  );

  if (!href) return <article className={shell}>{body}</article>;

  return (
    <Link
      href={href}
      className={cn(
        shell,
        "focus-visible:outline-brand transition-shadow hover:shadow-[var(--shadow-panel)] focus-visible:outline-2 focus-visible:outline-offset-2",
      )}
    >
      {body}
    </Link>
  );
}
