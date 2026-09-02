"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/primitives/Button";
import { ResultView } from "@/components/result/ResultView";
import { apiFetchHistoryResult, isSessionExpired } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth";
import type { AnalysisResult } from "@/types/analysis";

/**
 * 저장된 분석 결과.
 *
 * 셸(사이드바) 안에서 그린다 — 기록을 하나 보고 다음 기록으로 넘어가는
 * 것이 여기서 가장 잦은 일인데, 그때마다 목록 화면으로 돌아갔다 올 이유가
 * 없다. 지금 보고 있는 항목은 사이드바에서 표시된다.
 */
export default function HistoryResultPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { user, mounted } = useAuth();

  const [result,  setResult]  = useState<AnalysisResult | null>(null);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mounted) return;
    if (!user) { router.replace("/login"); return; }
    /* 목록은 이제 셸의 사이드바가 늘 옆에 두고 있다. id 가 없으면
       작업 화면으로 보낸다 — /history 로 보내면 한 번 더 튕긴다. */
    if (!id)   { router.replace("/"); return; }

    apiFetchHistoryResult(user.token, id)
      .then(setResult)
      .catch((e) => {
        /* 만료면 헬퍼가 세션을 이미 지웠다. 로그인으로 보낸다. */
        if (isSessionExpired(e)) { router.replace("/login"); return; }
        setError(e instanceof Error ? e.message : "불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, [mounted, user, id, router]);

  /* 셸은 user 가 있어야 그린다. 로그인 확인 전에는 맨 스켈레톤만. */
  if (!mounted || !user) return <Skeleton />;

  return (
    <AppShell user={user}>
      {loading ? (
        <Skeleton />
      ) : error ? (
        <div className="flex flex-1 justify-center px-5 py-16 md:px-10">
          <div className="w-full max-w-[540px]">
            <p
              className="font-mono text-xs tracking-[var(--tracking-label)]"
              style={{ color: "var(--color-missing)" }}
            >
              Failed
            </p>
            <h1 className="text-fg mt-4 text-2xl font-medium tracking-[var(--tracking-heading)]">
              결과를 불러올 수 없습니다
            </h1>
            <p className="text-fg-dim mt-3 text-xs leading-loose">{error}</p>
            <div className="border-border mt-8 border-t pt-6">
              <Button asChild variant="secondary" size="sm">
                <Link href="/">새 분석</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : result ? (
        <ResultView data={result} historyId={id} />
      ) : null}
    </AppShell>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10 space-y-4">
      <div className="bg-surface h-32 animate-pulse rounded-2xl" />
      <div className="bg-surface h-16 animate-pulse rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-surface h-36 animate-pulse rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
