import { cn } from "@/lib/cn";
import { scoreTier, tierStyles } from "@/lib/score";
import type { Scores } from "@/types/analysis";

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
 * 지표별 점수.
 *
 * 이름은 analysis_engine.py 의 채널 정의를 그대로 따른다 — 그 소스 묶음이
 * 곧 채널의 뜻이고, 랜딩도 같은 이름으로 부른다:
 *
 *   TES ← KIPRIS · DART                    → 기술 근거
 *   HES ← KC · RRA                         → 공인 인증
 *   CES ← TIPA · KORAIA · GS · NEP · 조달청 → 기관 이력
 *
 * 필드명이 헷갈리니 주의 — `verification_credibility` 가 HES 이고
 * `text_credibility` 가 TES 다 (server.py:770).
 *
 * 조형은 다섯 줄을 흰 카드로 각각 두르던 것을 괘선으로 바꿨다. 불릿으로
 * 쓰이던 `▶` 도 뺐다 — 재생 버튼 기호라 스크린리더가 "검은색 오른쪽
 * 방향 삼각형"이라고 읽었다.
 */
export function KpiCardGrid({ scores }: KpiCardGridProps) {
  const rows: ScoreRow[] = [
    {
      key: "TES",
      label: "기술 근거",
      value: scores.text_credibility,
      hint: "KIPRIS 특허 출원 이력과 DART 공시에서 기술 보유 근거를 찾습니다.",
    },
    {
      key: "HES",
      label: "공인 인증",
      value: scores.verification_credibility,
      hint: "KC 인증과 전파인증 RRA 에 해당 모델이 등록돼 있는지 확인합니다.",
    },
    {
      key: "CES",
      label: "기관 이력",
      value: scores.relational_credibility,
      hint: "TIPA · KORAIA · GS · NEP · 조달청에 남은 기업 활동 이력을 봅니다.",
    },
    {
      key: "ECS",
      label: "근거 채널 다양성",
      value: scores.ecs,
      hint: "세 채널 중 몇 곳에서 근거가 확인됐는지 나타냅니다.",
    },
    {
      key: "CONF",
      label: "분석 신뢰도",
      value: scores.conf,
      hint: "수집된 증거의 양과 질을 바탕으로 이 분석 자체의 확신도를 나타냅니다.",
    },
  ];

  return (
    <section aria-label="지표별 점수">
      <h3 className="text-fg-subtle mb-3 text-[13px] font-medium tracking-widest uppercase">
        지표별 점수 (100점 만점)
      </h3>
      <ul className="border-border divide-border divide-y border-y">
        {rows.map(({ key, label, value, hint }) => {
          const styles = tierStyles[scoreTier(value)];
          return (
            <li key={key} className="py-3.5">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-fg text-sm font-medium tracking-tight">
                  {label}
                  <span className="text-fg-faint ml-1.5 text-xs font-normal">
                    {key}
                  </span>
                </p>
                <p
                  className={cn(
                    "shrink-0 text-sm font-medium tabular-nums",
                    styles.text,
                  )}
                >
                  {value.toFixed(1)}
                </p>
              </div>
              <p className="text-fg-dim mt-1 text-xs leading-relaxed">{hint}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
