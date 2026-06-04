import { KpiCard } from "@/components/result/KpiCard";
import type { Scores } from "@/types/analysis";

interface KpiCardGridProps {
  scores: Scores;
}

/**
 * 2x2 grid of dimension-coloured KPI cards: overall + the three credibility
 * axes. All four use the same component but only the overall card gets the
 * gradient-number gauge treatment.
 */
export function KpiCardGrid({ scores }: KpiCardGridProps) {
  return (
    <section aria-label="신뢰도 메트릭" className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <KpiCard
        dimension="washing"
        value={scores.overall}
        hint="0에 가까울수록 AI 워싱 위험이 낮습니다."
        isOverall
      />
      <KpiCard
        dimension="text"
        value={scores.text_credibility}
        hint="AI 주장의 구체성 부족 정도입니다. 낮을수록 표현이 구체적입니다."
      />
      <KpiCard
        dimension="verify"
        value={scores.verification_credibility}
        hint="공공 인증·등록 미보유 정도입니다. 낮을수록 인증 커버리지가 넓습니다."
      />
      <KpiCard
        dimension="relational"
        value={scores.relational_credibility}
        hint="특허·기술 보유 근거 부족 정도입니다. 낮을수록 보유 근거가 많습니다."
      />
    </section>
  );
}
