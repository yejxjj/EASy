import Link from "next/link";

import { cn } from "@/lib/cn";

/**
 * 페이지 하단의 딥블루 CTA 박스.
 *
 * 화면당 채움 액센트 버튼은 하나만 둔다. 여기서는 흰 채움 버튼이
 * 그 하나이므로, 배너 안에 보조 버튼을 추가하지 않는다.
 */
export function CtaBanner({
  eyebrow = "Get Started",
  headline,
  actionLabel,
  href,
  className,
}: {
  eyebrow?: string;
  headline: string;
  actionLabel: string;
  href: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
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
      <Link
        href={href}
        className="text-brand-fg mt-6 inline-block rounded-[var(--radius-pill)] bg-white px-6 py-2.5 text-xs font-medium transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
