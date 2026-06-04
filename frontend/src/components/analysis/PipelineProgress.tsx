"use client";

import { useEffect, useState } from "react";

import { StepItem } from "@/components/analysis/StepItem";
import { computeElapsed, computeEta } from "@/lib/timing";
import {
  STAGE_LABELS,
  STAGE_ORDER,
  type ProgressEvent,
  type StageStatus,
} from "@/types/analysis";

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
  // Tick once per second so elapsed/ETA stay live even between SSE pushes.
  const [, force] = useState(0);
  useEffect(() => {
    if (!progress || progress.status === "completed" || progress.status === "failed") {
      return;
    }
    const id = window.setInterval(() => force((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [progress]);

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

  const elapsed = computeElapsed(progress);
  const eta = computeEta(progress);

  return (
    <section
      className="relative isolate flex min-h-[calc(100vh-128px)] items-start justify-center"
      aria-live="polite"
      aria-busy={status === "running" || status === "queued"}
    >
      {/* Loading-page background: very faint single brand radial. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--bg-loading-radial)" }}
      />

      <div className="mx-auto flex w-full max-w-md flex-col items-center px-6 pt-16 pb-24">
        <div className="flex flex-col items-center gap-1">
          <span className="fides-wordmark text-4xl font-extrabold tracking-tight">
            Fides
          </span>
          <span className="mono-eyebrow">analysis engine</span>
        </div>

        {/* Big percent + elapsed/ETA */}
        <div className="mt-12 mb-3 flex w-full items-end justify-between gap-4">
          <div>
            <p className="text-fg-subtle text-xs">{currentLabel}</p>
            <p className="text-fg text-5xl font-extrabold tracking-tight tabular-nums">
              {percent}
              <span className="text-fg-dim text-2xl font-bold">%</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-fg-subtle text-[11px]">
              <span className="text-fg font-mono tabular-nums">
                {elapsed.toFixed(0)}s
              </span>{" "}
              경과
            </p>
            <p className="text-fg-dim text-[11px]">
              ~
              <span className="font-mono tabular-nums">{eta.toFixed(0)}s</span>{" "}
              남음
            </p>
          </div>
        </div>

        {/* Slim gradient progress bar with glowing dot. */}
        <div className="bg-surface-strong relative mb-10 h-[3px] w-full overflow-hidden rounded-full">
          <div
            className="relative h-full rounded-full transition-[width] duration-500 ease-out"
            style={{
              width: `${percent}%`,
              background: "var(--gradient-cta)",
            }}
          >
            <span
              aria-hidden
              className="bg-accent absolute right-0 top-1/2 size-2 -translate-y-1/2 rounded-full shadow-[0_0_12px_rgba(124,95,242,0.5)]"
            />
          </div>
        </div>

        <ol className="flex w-full flex-col gap-1">
          {stages.map((s, idx) => (
            <StepItem key={s.name} index={idx + 1} stage={s} />
          ))}
        </ol>

        <p className="mt-10 mono-eyebrow text-fg-dim">analysis #{analysisId.slice(0, 8)}</p>
        <p className="text-fg-subtle mt-2 text-center text-xs leading-relaxed">
          6단계 파이프라인이 순차적으로 실행됩니다. 평균 18초가량 걸려요.
        </p>
      </div>
    </section>
  );
}
