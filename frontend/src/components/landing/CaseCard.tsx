import Link from "next/link";

import { cn } from "@/lib/cn";

/**
 * 분석 사례 카드.
 *
 * 상단 컬러 블록은 카테고리 구분용이지 판정 색이 아니다. 판정은 언제나
 * 3색 체계(확인·부분·없음)로만 표현하므로, 여기에 그 색을 쓰면 의미가
 * 충돌한다. 그래서 별도 계열색을 둔다.
 */

export type CaseTone = "blue" | "green" | "violet";

const TONE_GRADIENT: Record<CaseTone, string> = {
  blue: "linear-gradient(140deg, #2f79f5, #0a36b8)",
  green: "linear-gradient(140deg, #1fb98a, #0a6a54)",
  violet: "linear-gradient(140deg, #7c5cff, #3a22b8)",
};

export interface CaseCardProps {
  category: string;
  headline: string;
  summary: string;
  tags: string[];
  tone?: CaseTone;
  href?: string;
  className?: string;
}

export function CaseCard({
  category,
  headline,
  summary,
  tags,
  tone = "blue",
  href,
  className,
}: CaseCardProps) {
  const body = (
    <>
      <div
        className="relative h-[104px] overflow-hidden rounded-[var(--radius-tile)] p-3.5"
        style={{ background: TONE_GRADIENT[tone] }}
      >
        <span
          aria-hidden
          className="absolute -right-4 -bottom-4 size-16 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,.19), transparent 66%)",
          }}
        />
        <p className="relative text-xs text-white/75">{category}</p>
        <p className="relative mt-1.5 text-sm leading-snug font-medium whitespace-pre-line text-white">
          {headline}
        </p>
      </div>

      <p className="text-fg-muted mt-2.5 text-xs leading-relaxed">{summary}</p>
      <p className="text-fg-faint mt-1.5 text-xs">
        {tags.map((t) => `#${t}`).join(" ")}
      </p>
    </>
  );

  if (!href) {
    return <article className={className}>{body}</article>;
  }

  return (
    <Link
      href={href}
      className={cn(
        "focus-visible:outline-brand block rounded-[var(--radius-tile)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4",
        className,
      )}
    >
      {body}
    </Link>
  );
}
