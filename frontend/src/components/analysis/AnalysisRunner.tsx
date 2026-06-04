"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { PipelineProgress } from "@/components/analysis/PipelineProgress";
import { Button } from "@/components/primitives/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/primitives/Card";
import { ResultView } from "@/components/result/ResultView";
import { fetchProgress, fetchResult, openProgressStream } from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import type { AnalysisResult, ProgressEvent } from "@/types/analysis";

type Phase = "bootstrapping" | "running" | "complete" | "error";

interface AnalysisRunnerProps {
  id: string;
}

export function AnalysisRunner({ id }: AnalysisRunnerProps) {
  const [phase, setPhase] = useState<Phase>("bootstrapping");
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1) On mount, try the final result first. If 200, the job is already done
  //    (refresh-safe). If 404/409, switch to streaming.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetchResult(id);
        if (!alive) return;
        setResult(r);
        setPhase("complete");
      } catch (err) {
        if (!alive) return;
        if (err instanceof ApiError && err.status === 404) {
          setErrorMessage(
            "해당 분석을 찾을 수 없습니다. URL을 다시 확인해 주세요.",
          );
          setPhase("error");
          return;
        }
        // 409 (not yet completed) or any other error → stream progress.
        try {
          const snap = await fetchProgress(id);
          if (alive) setProgress(snap);
        } catch {
          // Snapshot can fail (e.g. server starting); the stream will recover.
        }
        if (alive) setPhase("running");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // 2) While running, open the SSE stream.
  useEffect(() => {
    if (phase !== "running") return;
    const close = openProgressStream(id, {
      onProgress: (ev) => setProgress(ev),
      onComplete: async () => {
        try {
          const r = await fetchResult(id);
          setResult(r);
          setPhase("complete");
        } catch (err) {
          setErrorMessage(
            err instanceof ApiError
              ? err.message
              : "결과를 불러올 수 없습니다.",
          );
          setPhase("error");
        }
      },
      onError: (streamErr) => {
        if (streamErr.kind === "server") {
          setProgress(streamErr.event);
          const firstError = streamErr.event.stages.find(
            (s) => s.state === "error",
          );
          setErrorMessage(
            firstError?.error_message ?? "분석 도중 오류가 발생했습니다.",
          );
          setPhase("error");
        } else {
          setErrorMessage(
            "실시간 연결이 끊겼습니다. 페이지를 새로고침해 주세요.",
          );
        }
      },
    });
    return close;
  }, [phase, id]);

  if (phase === "error") {
    return <ErrorPanel message={errorMessage ?? "알 수 없는 오류가 발생했습니다."} />;
  }
  if (phase === "complete" && result) {
    return <ResultView data={result} />;
  }
  return <PipelineProgress analysisId={id} progress={progress} />;
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <section className="mx-auto max-w-2xl px-6 py-20">
      <Card>
        <CardHeader>
          <div className="text-danger flex items-center gap-2">
            <AlertTriangle size={18} aria-hidden />
            <CardTitle className="text-danger">분석을 표시할 수 없습니다</CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-fg-muted text-sm leading-relaxed">{message}</p>
          <div className="mt-6">
            <Button asChild variant="primary">
              <Link href="/">
                <RotateCcw size={16} aria-hidden />
                새 분석 시작
              </Link>
            </Button>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
