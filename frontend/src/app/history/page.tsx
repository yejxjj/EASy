"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { apiDeleteHistory, apiFetchHistory } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import type { HistoryItem } from "@/types/auth";

export default function HistoryPage() {
  const router         = useRouter();
  const { user, mounted } = useAuth();
  const [items,   setItems]   = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!mounted) return;
    if (!user) { router.replace("/login"); return; }

    apiFetchHistory(user.token)
      .then(setItems)
      .catch(() => setError("기록을 불러오지 못했습니다. 다시 시도해 주세요."))
      .finally(() => setLoading(false));
  }, [mounted, user, router]);

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!user) return;
    if (!confirm("이 분석 기록을 삭제할까요?")) return;
    await apiDeleteHistory(user.token, id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  /* 로딩 / 미마운트 */
  if (!mounted || loading) return <Skeleton />;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">

      {/* 헤더 */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="mono-eyebrow mb-1">Analysis History</p>
          <h1 className="text-fg text-2xl font-bold tracking-tight">내 분석 기록</h1>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/">← 홈으로</Link>
        </Button>
      </div>

      {error && (
        <p className="text-danger mb-4 rounded-xl bg-danger/5 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      {/* 빈 상태 */}
      {!error && items.length === 0 && (
        <Card className="flex flex-col items-center gap-5 py-20 text-center">
          <div className="text-fg-dim text-4xl">🔍</div>
          <div>
            <p className="text-fg font-semibold">아직 분석 기록이 없습니다</p>
            <p className="text-fg-muted mt-1 text-sm">
              URL을 입력해 첫 번째 AI 워싱 분석을 시작해 보세요.
            </p>
          </div>
          <Button asChild variant="cta" size="md">
            <Link href="/">분석 시작하기 →</Link>
          </Button>
        </Card>
      )}

      {/* 목록 */}
      {items.length > 0 && (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Link key={item.id} href={`/history/${item.id}`} className="block">
              <HistoryCard
                item={item}
                onDelete={(e) => handleDelete(item.id, e)}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 히스토리 카드 ── */
function HistoryCard({
  item,
  onDelete,
}: {
  item: HistoryItem;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const score = item.accs_score ?? 0;

  const tier =
    score >= 60
      ? { label: "신뢰 가능", cls: "text-ok   bg-ok-soft" }
      : score >= 35
        ? { label: "불확실",   cls: "text-warn bg-warn-soft" }
        : { label: "AI 워싱",  cls: "text-danger bg-danger-soft" };

  const scoreColor =
    score >= 60 ? "text-ok" : score >= 35 ? "text-warn" : "text-danger";

  const strapColor =
    score >= 60 ? ("brand" as const) : score >= 35 ? ("warm" as const) : ("washing" as const);

  return (
    <Card
      strapColor={strapColor}
      className="group flex items-center gap-4 p-4 transition-all hover:translate-x-1 hover:shadow-md cursor-default"
    >
      {/* 제품 정보 */}
      <div className="min-w-0 flex-1">
        <p className="text-fg truncate text-sm font-semibold">
          {item.product_name}
        </p>
        <p className="text-fg-subtle mt-0.5 font-mono text-xs">
          {item.company_name ? `${item.company_name} · ` : ""}
          {item.created_at}
        </p>
      </div>

      {/* 점수 + 배지 */}
      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold",
            tier.cls,
          )}
        >
          {tier.label}
        </span>
        <span
          className={cn(
            "font-mono text-xl font-extrabold leading-none tabular-nums",
            scoreColor,
          )}
        >
          {score.toFixed(1)}
        </span>
      </div>

      {/* 삭제 버튼 (hover 시 노출) */}
      <button
        onClick={onDelete}
        className={cn(
          "text-fg-dim hover:text-danger hover:bg-danger-soft",
          "ml-1 hidden rounded-lg p-1.5 transition-colors",
          "group-hover:flex items-center justify-center",
        )}
        aria-label="삭제"
        title="삭제"
      >
        <span aria-hidden className="text-sm leading-none">✕</span>
      </button>
    </Card>
  );
}

/* ── 스켈레톤 ── */
function Skeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8 space-y-2">
        <div className="bg-surface h-3 w-28 animate-pulse rounded" />
        <div className="bg-surface h-6 w-44 animate-pulse rounded" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-surface mb-3 h-[68px] animate-pulse rounded-2xl" />
      ))}
    </div>
  );
}
