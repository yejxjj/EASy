"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/primitives/Button";
import { ResultView } from "@/components/result/ResultView";
import { apiFetchHistoryResult, isSessionExpired } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth";
import type { AnalysisResult } from "@/types/analysis";

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
    /* 목록은 대시보드 하나로 모았다 (next.config.ts 의 /history 리다이렉트).
       여기서 /history 로 보내면 한 번 더 튕긴다. */
    if (!id)   { router.replace("/dashboard"); return; }

    apiFetchHistoryResult(user.token, id)
      .then(setResult)
      .catch((e) => {
        /* 만료면 헬퍼가 세션을 이미 지웠다. 로그인으로 보낸다. */
        if (isSessionExpired(e)) { router.replace("/login"); return; }
        setError(e instanceof Error ? e.message : "불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, [mounted, user, id, router]);

  if (!mounted || loading) return <Skeleton />;

  if (error) {
    return (
      <div className="bg-bg flex flex-1 justify-center px-5 py-16 md:px-10">
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
              <Link href="/dashboard">대시보드로</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return <ResultView data={result} historyId={id} />;
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
