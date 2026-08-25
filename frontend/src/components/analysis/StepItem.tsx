import { AlertTriangle, Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";
import type { StageStatus } from "@/types/analysis";

/**
 * 파이프라인 한 단계.
 *
 * 알약과 라운드 카드 배경을 걷어내고 괘선 위의 한 줄로 바꿨다. 여섯 줄을
 * 배경색으로 구분하면 진행 중인 단계가 아니라 색칸이 먼저 보인다. 지금은
 * 번호 자리의 아이콘과 오른쪽 상태 글자, 두 곳만 색이 바뀐다.
 *
 * 상태 라벨을 한글로 옮겼다. 화면의 나머지가 전부 한글인데 이 줄만
 * `DONE / RUN / WAIT / ERR` 였다.
 */

interface StepItemProps {
  index: number;
  stage: StageStatus;
}

const STATE: Record<StageStatus["state"], { label: string; color: string }> = {
  done: { label: "완료", color: "var(--color-brand-fg)" },
  running: { label: "진행 중", color: "var(--color-brand-fg)" },
  wait: { label: "대기", color: "var(--color-fg-faint)" },
  error: { label: "오류", color: "var(--color-missing)" },
};

export function StepItem({ index, stage }: StepItemProps) {
  const isDone = stage.state === "done";
  const isRunning = stage.state === "running";
  const isError = stage.state === "error";
  const s = STATE[stage.state];

  return (
    <li className="grid grid-cols-[22px_minmax(0,1fr)_auto] items-baseline gap-x-4 py-3.5">
      <span
        className="grid place-items-center font-mono text-xs"
        style={{ color: s.color }}
        aria-hidden
      >
        {isDone ? (
          <Check size={13} />
        ) : isRunning ? (
          <Loader2 size={13} className="animate-spin" />
        ) : isError ? (
          <AlertTriangle size={13} />
        ) : (
          <span className="tnum">{String(index).padStart(2, "0")}</span>
        )}
      </span>

      <div className="min-w-0">
        <p
          className={cn(
            "text-sm tracking-[var(--tracking-tight)]",
            isRunning ? "text-fg font-medium" : "text-fg",
          )}
        >
          {stage.label}
        </p>
        <p
          className="mt-0.5 text-xs leading-relaxed"
          style={{
            color:
              isError && stage.error_message
                ? "var(--color-missing)"
                : "var(--color-fg-dim)",
          }}
        >
          {isError && stage.error_message ? stage.error_message : stage.sub_label}
        </p>
      </div>

      <span
        className="font-mono text-xs tracking-[var(--tracking-label)]"
        style={{ color: s.color }}
      >
        {s.label}
      </span>
    </li>
  );
}
