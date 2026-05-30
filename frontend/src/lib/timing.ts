/**
 * Frontend mirror of `backend/app/models/mock/timing.py`.
 *
 * Used only by the loading page to estimate elapsed/ETA seconds for a nicer
 * UX. The backend remains the source of truth for actual pacing; this is
 * just a display heuristic. If the backend's timing changes, update both.
 */

import type { ProgressEvent, StageName, StageStatus } from "@/types/analysis";

export const STAGE_TIMING_GUESS_SECONDS: Record<StageName, number> = {
  crawl: 2.0,
  ocr: 3.5,
  llm_refine: 4.0,
  public_verify: 3.0,
  patent_search: 3.0,
  score: 2.5,
};

export const TOTAL_STAGE_SECONDS = Object.values(STAGE_TIMING_GUESS_SECONDS).reduce(
  (a, b) => a + b,
  0,
);

/**
 * Best-effort elapsed-seconds estimate.
 *
 * Adds up `finished_at - started_at` for every DONE stage. For the active
 * RUNNING stage, falls back to `now - started_at`. The result is always
 * non-negative and clamped to a small upper bound for safety.
 */
export function computeElapsed(progress: ProgressEvent | null, now: Date = new Date()): number {
  if (!progress) return 0;
  let elapsed = 0;
  for (const stage of progress.stages) {
    if (stage.state === "done" && stage.started_at && stage.finished_at) {
      elapsed += secondsBetween(stage.started_at, stage.finished_at);
    } else if (stage.state === "running" && stage.started_at) {
      elapsed += secondsBetween(stage.started_at, now.toISOString());
    }
  }
  return Math.max(0, elapsed);
}

/**
 * ETA estimate — sums the expected wall-clock for each WAIT / RUNNING stage,
 * subtracting how much of the running stage has already elapsed.
 */
export function computeEta(progress: ProgressEvent | null, now: Date = new Date()): number {
  if (!progress) return TOTAL_STAGE_SECONDS;
  if (progress.status === "completed") return 0;
  if (progress.status === "failed") return 0;

  let eta = 0;
  for (const stage of progress.stages) {
    const budget = STAGE_TIMING_GUESS_SECONDS[stage.name];
    if (stage.state === "wait") {
      eta += budget;
    } else if (stage.state === "running") {
      const runFor = stage.started_at
        ? Math.max(0, secondsBetween(stage.started_at, now.toISOString()))
        : 0;
      eta += Math.max(0, budget - runFor);
    }
  }
  return Math.max(0, eta);
}

/**
 * Returns the stage budget for the active stage (running) or the next
 * WAIT stage if none is running.
 */
export function activeStageBudget(stages: StageStatus[]): { name: StageName | null; seconds: number } {
  const running = stages.find((s) => s.state === "running");
  if (running) {
    return { name: running.name, seconds: STAGE_TIMING_GUESS_SECONDS[running.name] };
  }
  const nextWait = stages.find((s) => s.state === "wait");
  if (nextWait) {
    return { name: nextWait.name, seconds: STAGE_TIMING_GUESS_SECONDS[nextWait.name] };
  }
  return { name: null, seconds: 0 };
}

function secondsBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 1000;
}
