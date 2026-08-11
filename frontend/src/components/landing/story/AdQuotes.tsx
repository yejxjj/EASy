import { cn } from "@/lib/cn";

/**
 * 실제 상품 페이지에 실린 AI 문구들.
 *
 * 랜딩의 첫 긴장을 만드는 자리다. 설명을 먼저 하지 않고 실물을 들이댄 뒤
 * "이 중 무엇이 검증됐는가"를 묻는다.
 *
 * 특정 기업을 지목하지 않도록 브랜드명은 뺀 문구만 인용한다.
 */

export interface AdQuote {
  headline: string;
  body: string;
}

export function AdQuotes({
  quotes,
  className,
}: {
  quotes: AdQuote[];
  className?: string;
}) {
  return (
    <ul className={cn("grid grid-cols-1 gap-3 sm:grid-cols-3", className)}>
      {quotes.map((quote) => (
        <li
          key={quote.headline}
          className="rounded-[var(--radius-tile)] border border-white/12 bg-white/[0.04] p-4"
        >
          <p className="text-[15px] leading-snug font-medium text-white">
            “{quote.headline}”
          </p>
          <p className="mt-2.5 text-xs leading-relaxed text-white/55">{quote.body}</p>
          <p className="mt-3.5 font-mono text-xs tracking-[var(--tracking-label)] text-[color:var(--color-missing)]">
            근거 미확인
          </p>
        </li>
      ))}
    </ul>
  );
}
