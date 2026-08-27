import { cn } from "@/lib/cn";
import { CREDIBILITY_AXES, scoreTier, tierStyles } from "@/lib/score";
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
 * 세 축의 이름과 설명은 `lib/score.ts` 의 `CREDIBILITY_AXES` 가 정본이다.
 * 여기에 따로 적어 두면 비교 화면과 어긋난다 — 실제로 그런 적이 있다.
 *
 * 조형은 다섯 줄을 흰 카드로 각각 두르던 것을 괘선으로 바꿨다. 불릿으로
 * 쓰이던 `▶` 도 뺐다 — 재생 버튼 기호라 스크린리더가 "검은색 오른쪽
 * 방향 삼각형"이라고 읽었다.
 */
export function KpiCardGrid({ scores }: KpiCardGridProps) {
  const rows: ScoreRow[] = [
    ...CREDIBILITY_AXES.map((a) => ({
      key: a.code,
      label: a.label,
      value: scores[a.field],
      hint: a.hint,
    })),
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
