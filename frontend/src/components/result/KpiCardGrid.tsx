import type { Scores } from "@/types/analysis";
import { scoreTier, tierStyles } from "@/lib/score";
import { cn } from "@/lib/cn";

interface KpiCardGridProps {
  scores: Scores;
}

interface ScoreRow {
  key: string;
  label: string;
  value: number;
  hint: string;
}

/**
 * 지표별 점수 리스트 (100점 만점 기준)
 * ▶ 하드웨어 실체성 (HES): 65.00점
 */
export function KpiCardGrid({ scores }: KpiCardGridProps) {
  const rows: ScoreRow[] = [
    {
      key: "HES",
      label: "하드웨어 실체성",
      value: scores.verification_credibility,
      hint: "실제 하드웨어 구성 요소가 제품에 포함되어 있는지 평가합니다.",
    },
    {
      key: "TES",
      label: "기술적 근거성",
      value: scores.text_credibility,
      hint: "AI 관련 기술 주장이 구체적인 근거로 뒷받침되는지 평가합니다.",
    },
    {
      key: "CES",
      label: "인증/공공 신뢰성",
      value: scores.relational_credibility,
      hint: "공공 인증·등록 여부로 제품 신뢰성을 평가합니다.",
    },
    {
      key: "ECS",
      label: "근거 채널 다양성",
      value: scores.ecs,
      hint: "특허·인증·공공 데이터 등 다양한 채널에서 근거가 확인되는지 평가합니다.",
    },
    {
      key: "CONF",
      label: "분석 신뢰도",
      value: scores.conf,
      hint: "수집된 증거의 양과 질을 바탕으로 분석 결과의 신뢰도를 나타냅니다.",
    },
  ];

  return (
    <section aria-label="지표별 점수">
      <h3 className="text-fg-subtle mb-3 text-[13px] font-semibold uppercase tracking-widest">
        지표별 점수 (100점 만점 기준)
      </h3>
      <ul className="flex flex-col gap-2">
        {rows.map(({ key, label, value, hint }) => {
          const tier = scoreTier(value);
          const styles = tierStyles[tier];
          return (
            <li
              key={key}
              className="flex flex-col gap-1 rounded-xl border border-[#e5e9f2] bg-white px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-[#3a3f5c]">
                  <span className="mr-1.5 font-bold text-[#2563eb]">▶</span>
                  <span className="font-semibold">{label}</span>
                  <span className="ml-1.5 text-[12px] text-fg-subtle font-normal">({key})</span>
                </span>
                <span className={cn("font-mono text-[15px] font-semibold tabular-nums", styles.text)}>
                  {value.toFixed(2)}점
                </span>
              </div>
              <p className="text-[12px] text-fg-muted leading-relaxed pl-4">{hint}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
