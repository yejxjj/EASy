import { RotateCcw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/primitives/Button";

/** Bottom-of-page call-to-action card to restart a new analysis. */
export function ResultFooterCta() {
  return (
    <div className="border-border bg-surface flex flex-col items-center gap-4 rounded-[var(--radius-card)] border px-6 py-10 text-center">
      <p className="mono-eyebrow">next step</p>
      <h2 className="text-fg text-xl font-bold tracking-tight md:text-2xl">
        다른 상품도 함께 비교해 보세요.
      </h2>
      <p className="text-fg-muted max-w-md text-sm leading-relaxed">
        분석 결과는 보조 지표입니다. 동일 카테고리의 다른 상품과 종합 점수,
        XAI 근거, 인증 현황을 함께 비교하면 더 정확한 판단을 할 수 있어요.
      </p>
      <Button asChild variant="cta" size="lg">
        <Link href="/">
          <RotateCcw size={16} aria-hidden />
          새 분석 시작
        </Link>
      </Button>
    </div>
  );
}
