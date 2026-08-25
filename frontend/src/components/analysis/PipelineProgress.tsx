"use client";

import { useEffect, useRef, useState } from "react";

import { StepItem } from "@/components/analysis/StepItem";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { computeEta } from "@/lib/timing";
import {
  STAGE_LABELS,
  STAGE_ORDER,
  type ProgressEvent,
  type StageStatus,
} from "@/types/analysis";

/**
 * 분석 진행 화면.
 *
 * 이전에는 이 파일 안에 125줄짜리 `<style>` 블록이 있었고, 자체 팔레트와
 * `'Inter'` · `'JetBrains Mono'` 를 직접 참조했다. 그래서 같은 화면에서
 * 부모는 Inter, 자식(StepItem)은 토큰 기반으로 그려져 활자 체계가 둘로
 * 갈려 있었다. 이제 전부 토큰과 Pretendard 를 쓴다.
 *
 * 조형도 랜딩과 같은 규칙으로 맞췄다 — 상자를 씌우지 않고 괘선과 타이포로
 * 나눈다. 진행 바는 그라데이션 대신 브랜드 단색이고, 큰 숫자의 무게는
 * medium 이다 (이전 800 은 이 디자인에 없는 굵기였다).
 *
 * 남은 예상 시간을 표시한다. `computeEta` 는 원래부터 계산되고 있었으나
 * 화면에 쓰이지 않아 lib/timing.ts 의 주석("로딩 페이지가 elapsed/ETA 를
 * 추정하는 데 쓴다")과 어긋나 있었다.
 */

interface PipelineProgressProps {
  analysisId: string;
  progress: ProgressEvent | null;
}

function initialStages(): StageStatus[] {
  return STAGE_ORDER.map((name) => ({
    name,
    label: STAGE_LABELS[name].name,
    sub_label: STAGE_LABELS[name].sub,
    state: "wait",
    started_at: null,
    finished_at: null,
    error_message: null,
  }));
}

export function PipelineProgress({ analysisId, progress }: PipelineProgressProps) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = Date.now();
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const stages = progress?.stages ?? initialStages();
  const percent = progress?.overall_percent ?? 0;
  const status = progress?.status ?? "queued";
  const currentLabel = progress?.current_stage
    ? STAGE_LABELS[progress.current_stage].name
    : status === "queued"
      ? "분석 준비 중"
      : status === "completed"
        ? "완료"
        : "진행 중";

  const eta = computeEta(progress);

  return (
    <section
      className="bg-bg flex flex-1 justify-center px-5 py-16 md:px-10"
      aria-live="polite"
      aria-busy={status === "running" || status === "queued"}
    >
      <div className="w-full max-w-[540px]">
        <Eyebrow>Analysis Engine</Eyebrow>
        <h1 className="text-fg mt-4 text-2xl font-medium tracking-[var(--tracking-heading)]">
          {currentLabel}
        </h1>
        <p className="text-fg-dim mt-3 text-xs leading-loose">
          여섯 단계를 순서대로 지납니다. 공공 기록 조회는 외부 응답을 기다리므로
          단계마다 걸리는 시간이 다릅니다.
        </p>

        {/* 진행률 */}
        <div className="mt-10 flex items-end justify-between gap-6">
          <p className="tnum text-fg text-[40px] leading-none font-medium tracking-[var(--tracking-display)]">
            {percent}
            <span className="text-fg-faint ml-1 text-xl">%</span>
          </p>
          <div className="text-right">
            <p className="text-fg-dim text-xs">
              경과 <span className="tnum text-fg font-medium">{elapsed}s</span>
            </p>
            {/* 서버에서 아무 소식도 못 들었으면(progress === null) 남은 시간을
                말하지 않는다. computeEta 는 이때 총합을 그대로 돌려주므로,
                스트림이 끊기면 경과만 늘어나고 "남은 예상 18s" 가 영원히
                붙어 있게 된다. */}
            {progress && eta > 0 ? (
              <p className="text-fg-faint mt-1 text-xs">
                남은 예상 <span className="tnum">{Math.ceil(eta)}s</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="bg-border mt-4 h-[3px] w-full overflow-hidden rounded-full">
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${percent}%`, background: "var(--color-brand)" }}
          />
        </div>

        {/* 단계 */}
        <ol className="border-border divide-border mt-9 divide-y border-y">
          {stages.map((s, idx) => (
            <StepItem key={s.name} index={idx + 1} stage={s} />
          ))}
        </ol>

        <p className="text-fg-faint mt-8 font-mono text-xs tracking-[var(--tracking-label)]">
          Analysis {analysisId}
        </p>
      </div>
    </section>
  );
}
