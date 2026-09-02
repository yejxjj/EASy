import Link from "next/link";
import { type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { INVERT_TOKENS } from "@/components/primitives/Section";

/**
 * 페이지 하단의 딥블루 CTA 박스.
 *
 * 화면당 채움 액센트 버튼은 하나만 둔다. 여기서는 흰 채움 버튼이
 * 그 하나이므로, 배너 안에 보조 버튼을 추가하지 않는다.
 *
 * `action` 을 주면 기본 버튼 대신 그것을 렌더한다 — 랜딩에서는 URL 입력을
 * 여기에 두어 마지막 화면이 곧 전환 지점이 되게 한다.
 */
export function CtaBanner({
  eyebrow = "Get Started",
  headline,
  actionLabel,
  href,
  action,
  className,
}: {
  eyebrow?: string;
  headline: string;
  actionLabel?: string;
  href?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // 라이트 섹션 안에 놓인 다크 블록이므로 전경 토큰을 직접 뒤집는다
        INVERT_TOKENS,
        "rounded-[var(--radius-card)] px-6 py-10 text-center text-white",
        className,
      )}
      style={{ background: "var(--gradient-cta)" }}
    >
      <p className="font-mono text-xs tracking-[var(--tracking-label)] text-white/65">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-xl font-medium tracking-[var(--tracking-heading)] md:text-2xl">
        {headline}
      </h2>
      {action ? (
        <div className="mt-6 flex justify-center">{action}</div>
      ) : href && actionLabel ? (
        <Link
          href={href}
          className="text-brand-fg mt-6 inline-block rounded-[var(--radius-pill)] bg-white px-6 py-2.5 text-xs font-medium transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
