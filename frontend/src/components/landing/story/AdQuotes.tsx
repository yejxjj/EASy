import { cn } from "@/lib/cn";

/**
 * 실제 상품 페이지에 실린 AI 문구들.
 *
 * 랜딩의 첫 긴장을 만드는 자리다. 설명을 먼저 하지 않고 실물을 들이댄 뒤
 * "이 중 무엇이 검증됐는가"를 묻는다.
 *
 * 박스로 감싸지 않고 상단 괘선과 여백으로만 나눈다. 테두리 · 배경 · 모서리를
 * 다 갖춘 카드를 나열하면 어느 서비스에나 있는 화면이 된다. 인용문 자체가
 * 주인공이므로 그것만 남긴다.
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
    <ul className={cn("grid grid-cols-1 gap-x-9 gap-y-8 sm:grid-cols-3", className)}>
      {quotes.map((quote, i) => (
        <li key={quote.headline} className="border-t border-white/20 pt-5">
          <p className="font-mono text-xs tracking-[var(--tracking-label)] text-white/30">
            {String(i + 1).padStart(2, "0")}
          </p>
          <p className="mt-3.5 text-[17px] leading-snug font-medium text-white">
            “{quote.headline}”
          </p>
          <p className="mt-2.5 text-xs leading-relaxed text-white/55">{quote.body}</p>
          <p className="mt-4 font-mono text-xs tracking-[var(--tracking-label)] text-[color:var(--color-missing)]">
            근거 미확인
          </p>
        </li>
      ))}
    </ul>
  );
}
