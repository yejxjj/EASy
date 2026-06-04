"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/primitives/Button";
import { ResultView } from "@/components/result/ResultView";
import { apiFetchHistoryResult } from "@/lib/api/auth";
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
    if (!id)   { router.replace("/history"); return; }

    apiFetchHistoryResult(user.token, id)
      .then(setResult)
      .catch((e) => setError(e instanceof Error ? e.message : "불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [mounted, user, id, router]);

  if (!mounted || loading) return <Skeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-danger mb-4 text-sm">{error}</p>
        <Button asChild variant="secondary" size="sm">
          <Link href="/history">← 기록으로</Link>
        </Button>
      </div>
    );
  }

  if (!result) return null;

  return <ResultView data={result} />;
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
