import { AlertTriangle, Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";
import { STAGE_TIMING_GUESS_SECONDS } from "@/lib/timing";
import type { StageStatus } from "@/types/analysis";

interface StepItemProps {
  index: number;
  stage: StageStatus;
}

const STATE_LABEL: Record<StageStatus["state"], string> = {
  done: "DONE",
  running: "RUN",
  wait: "WAIT",
  error: "ERR",
};

export function StepItem({ index, stage }: StepItemProps) {
  const isDone = stage.state === "done";
  const isRunning = stage.state === "running";
  const isError = stage.state === "error";
  const budget = STAGE_TIMING_GUESS_SECONDS[stage.name];

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-3 transition-colors",
        isRunning && "bg-brand-soft",
        isError && "bg-danger-soft",
      )}
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full font-mono text-xs tracking-tight",
          isDone && "bg-brand-soft text-brand-fg",
          isRunning &&
            "bg-brand text-fg-on-brand shadow-[var(--shadow-glow-brand)]",
          isError && "bg-danger-soft text-danger",
          !isDone &&
            !isRunning &&
            !isError &&
            "bg-surface-strong text-fg-subtle",
        )}
        aria-hidden
      >
        {isDone ? (
          <Check size={14} />
        ) : isRunning ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isError ? (
          <AlertTriangle size={14} />
        ) : (
          index.toString().padStart(2, "0")
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-semibold tracking-tight",
            isError ? "text-danger" : isRunning ? "text-fg" : "text-fg",
          )}
        >
          {stage.label}
        </p>
        <p
          className={cn(
            "text-xs",
            isError && stage.error_message
              ? "text-danger"
              : "text-fg-subtle",
          )}
        >
          {isError && stage.error_message ? stage.error_message : stage.sub_label}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span
          className={cn(
            "font-mono text-[12px] uppercase tracking-[0.12em]",
            isDone && "text-brand-fg",
            isRunning && "text-fg",
            isError && "text-danger",
            !isDone && !isRunning && !isError && "text-fg-dim",
          )}
        >
          {STATE_LABEL[stage.state]}
        </span>
      </div>
    </li>
  );
}
