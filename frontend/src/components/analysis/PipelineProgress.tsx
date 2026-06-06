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

const CSS = `
.lp-loading {
  min-height: calc(100vh - 64px);
  background:
    radial-gradient(ellipse 70% 55% at 50% 0%, rgba(37,99,235,.06) 0%, transparent 60%),
    #f4f6fb;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  font-family: 'Inter', -apple-system, sans-serif;
}
.lp-loading-inner {
  width: 100%;
  max-width: 440px;
  padding: 64px 24px 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.lp-load-logo {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: .28em;
  text-transform: uppercase;
  color: #0e1120;
  margin-bottom: 4px;
}
.lp-load-sub {
  font-size: 11px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: rgba(14,17,32,.32);
}
.lp-load-nums {
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 48px;
  margin-bottom: 12px;
}
.lp-load-percent-wrap .lp-load-stage {
  font-size: 12px;
  color: rgba(14,17,32,.42);
  margin-bottom: 4px;
}
.lp-load-percent {
  font-size: 52px;
  font-weight: 800;
  letter-spacing: -.04em;
  color: #0e1120;
  line-height: 1;
}
.lp-load-percent span {
  font-size: 24px;
  font-weight: 600;
  color: rgba(14,17,32,.3);
}
.lp-load-time {
  text-align: right;
  line-height: 1.7;
}
.lp-load-time .elapsed {
  font-size: 13px;
  color: rgba(14,17,32,.55);
}
.lp-load-time .elapsed strong {
  font-family: 'JetBrains Mono', monospace;
  color: #0e1120;
  font-weight: 600;
}
.lp-load-time .eta {
  font-size: 12px;
  color: rgba(14,17,32,.32);
}
.lp-load-time .eta strong {
  font-family: 'JetBrains Mono', monospace;
}
.lp-load-bar-wrap {
  width: 100%;
  height: 3px;
  background: rgba(14,17,32,.09);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 32px;
}
.lp-load-bar-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #2563eb, #60a5fa);
  transition: width .5s ease;
  position: relative;
}
.lp-load-bar-dot {
  position: absolute;
  right: -1px;
  top: 50%;
  transform: translateY(-50%);
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 8px rgba(59,130,246,.6);
}
.lp-load-steps {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.lp-load-id {
  margin-top: 36px;
  font-size: 11px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: rgba(14,17,32,.25);
  font-family: 'JetBrains Mono', monospace;
}
.lp-load-hint {
  margin-top: 8px;
  font-size: 13px;
  color: rgba(14,17,32,.32);
  text-align: center;
  line-height: 1.7;
}
`;

export function PipelineProgress({ analysisId, progress }: PipelineProgressProps) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!progress || progress.status === "completed" || progress.status === "failed") return;
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
      className="lp-loading"
      aria-live="polite"
      aria-busy={status === "running" || status === "queued"}
    >
      <style>{CSS}</style>
      <div className="lp-loading-inner">
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 0 }}>
          <div className="lp-load-logo">Fides</div>
          <div className="lp-load-sub">analysis engine</div>
        </div>

        {/* Percent + time */}
        <div className="lp-load-nums">
          <div className="lp-load-percent-wrap">
            <div className="lp-load-stage">{currentLabel}</div>
            <div className="lp-load-percent">
              {percent}<span>%</span>
            </div>
          </div>
          <div className="lp-load-time">
            <div className="elapsed">
              <strong>{elapsed.toFixed(0)}s</strong> 경과
            </div>
            <div className="eta">
              ~<strong>{eta.toFixed(0)}s</strong> 남음
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="lp-load-bar-wrap">
          <div className="lp-load-bar-fill" style={{ width: `${percent}%` }}>
            {percent > 2 && <div className="lp-load-bar-dot" />}
          </div>
        </div>

        {/* Steps */}
        <ol className="lp-load-steps">
          {stages.map((s, idx) => (
            <StepItem key={s.name} index={idx + 1} stage={s} />
          ))}
        </ol>

        <div className="lp-load-id">analysis #{analysisId.slice(0, 8)}</div>
        <p className="lp-load-hint">
          6단계 파이프라인이 순차적으로 실행됩니다.<br />평균 18초가량 걸려요.
        </p>
      </div>
    </section>
  );
}
