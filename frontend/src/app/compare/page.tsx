"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { apiCompare } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import type { CompareItem } from "@/types/auth";

export default function ComparePage() {
  return (
    <Suspense>
      <CompareContent />
    </Suspense>
  );
}

function CompareContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user, mounted } = useAuth();

  const [items,   setItems]   = useState<CompareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!mounted) return;
    if (!user) { router.replace("/login"); return; }

    const raw = searchParams.get("ids") ?? "";
    const ids = raw.split(",").map(Number).filter(Boolean);
    if (ids.length < 2) { router.replace("/dashboard"); return; }

    apiCompare(user.token, ids)
      .then((d) => setItems(d.items))
      .catch((e) => setError(e instanceof Error ? e.message : "불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [mounted, user, router, searchParams]);

  if (!mounted || loading) return <Skeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-danger mb-4">{error}</p>
        <Button asChild variant="secondary" size="sm"><Link href="/dashboard">← 대시보드</Link></Button>
      </div>
    );
  }

  /* 추천 — 점수 가장 높은 제품 */
  const best = [...items].sort((a, b) => b.accs_score - a.accs_score)[0];

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">

      {/* 헤더 */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="mono-eyebrow mb-1">Compare</p>
          <h1 className="text-fg text-2xl font-bold tracking-tight">제품 비교</h1>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/dashboard">← 대시보드</Link>
        </Button>
      </div>

      {/* 추천 배너 */}
      <div className="mb-6 rounded-2xl border border-brand/30 bg-brand-soft px-5 py-4">
        <p className="mono-eyebrow mb-1">AI 추천</p>
        <p className="text-fg text-sm font-semibold">
          <span className="text-brand-fg font-extrabold">{best.product_name}</span>
          {" "}이 가장 신뢰도가 높습니다
          <span className="text-fg-muted ml-2 font-mono font-normal">({best.accs_score.toFixed(1)}점)</span>
        </p>
      </div>

      {/* 비교 카드 그리드 */}
      <div className={cn(
        "grid gap-4",
        items.length === 2 ? "grid-cols-2" : "grid-cols-3",
      )}>
        {items.map((item) => {
          const t = scoreTier(item.accs_score);
          const isBest = item.id === best.id;
          return (
            <CompareCard key={item.id} item={item} tier={t} isBest={isBest} />
          );
        })}
      </div>

      {/* 상세 비교 테이블 */}
      <Card className="mt-6">
        <div className="border-b border-border px-5 py-4">
          <p className="mono-eyebrow mb-0.5">Dimension Breakdown</p>
          <h2 className="text-fg text-sm font-semibold">3개 축 상세 비교</h2>
        </div>
        <div className="px-5 py-4">
          {(
            [
              { key: "text_credibility",         label: "텍스트 신뢰도",  sub: "AI 주장 구체성·검증 가능성" },
              { key: "verification_credibility", label: "검증 신뢰도",    sub: "공공 DB 교차 검증" },
              { key: "relational_credibility",   label: "관계형 신뢰도",  sub: "특허·인증 보유 근거" },
            ] as const
          ).map(({ key, label, sub }) => (
            <div key={key} className="mb-5 last:mb-0">
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-fg text-sm font-semibold">{label}</span>
                <span className="text-fg-dim font-mono text-xs">{sub}</span>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
                {items.map((item) => {
                  const val = (item[key] as number | undefined) ?? 0;
                  const t   = scoreTier(val);
                  const cls = TIER_CLS[t];
                  return (
                    <div key={item.id}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-fg-subtle truncate font-mono text-xs">{item.product_name}</span>
                        <span className={cn("font-mono text-xs font-bold tabular-nums", cls.text)}>{val.toFixed(1)}</span>
                      </div>
                      <div className="bg-surface-strong h-2 w-full overflow-hidden rounded-full">
                        <div
                          className={cn("h-full rounded-full transition-all", cls.bar)}
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── 비교 카드 ── */
function CompareCard({
  item, tier, isBest,
}: {
  item: CompareItem;
  tier: "ok" | "warn" | "danger";
  isBest: boolean;
}) {
  const cls = TIER_CLS[tier];
  const dims = [
    { label: "텍스트",  val: item.text_credibility         ?? 0 },
    { label: "검증",    val: item.verification_credibility ?? 0 },
    { label: "관계형",  val: item.relational_credibility   ?? 0 },
  ];
  const hasDims = dims.some((d) => d.val > 0);

  return (
    <div className={cn(
      "relative rounded-[var(--radius-card)] border p-5",
      isBest ? "border-brand bg-brand-soft" : "border-border bg-bg",
    )}>
      {isBest && (
        <span className="mono-eyebrow absolute right-3 top-3 rounded-full bg-brand px-2 py-0.5 text-white">
          추천
        </span>
      )}

      <p className="text-fg pr-12 text-sm font-bold leading-snug">{item.product_name}</p>
      <p className="text-fg-subtle mt-0.5 font-mono text-xs">
        {item.company_name || "브랜드 미상"}
      </p>

      {/* 종합 점수 */}
      <div className="my-4 text-center">
        <p className={cn("text-5xl font-extrabold tabular-nums tracking-tight", cls.text)}>
          {item.accs_score.toFixed(1)}
        </p>
        <span className={cn("mt-1 inline-block rounded-full px-3 py-0.5 font-mono text-xs font-semibold", cls.badge)}>
          {TIER_LABEL[tier]}
        </span>
      </div>

      {/* 종합 바 */}
      <div className="bg-surface-strong mb-4 h-2 w-full overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full", cls.bar)}
          style={{ width: `${item.accs_score}%` }}
        />
      </div>

      {/* 미니 Dimension 바 */}
      {hasDims && (
        <div className="space-y-2">
          {dims.map((d) => {
            const dt = scoreTier(d.val);
            const dc = TIER_CLS[dt];
            return (
              <div key={d.label}>
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="text-fg-dim font-mono text-[10px]">{d.label}</span>
                  <span className={cn("font-mono text-[10px] font-semibold tabular-nums", dc.text)}>
                    {d.val.toFixed(0)}
                  </span>
                </div>
                <div className="bg-surface-strong h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className={cn("h-full rounded-full", dc.bar)}
                    style={{ width: `${d.val}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-fg-dim mt-3 font-mono text-[10px]">{item.created_at}</p>
    </div>
  );
}

/* ── 유틸 ── */
function scoreTier(score: number): "ok" | "warn" | "danger" {
  return score >= 60 ? "ok" : score >= 35 ? "warn" : "danger";
}
const TIER_LABEL = { ok: "신뢰 가능", warn: "불확실", danger: "AI 워싱" } as const;
const TIER_CLS = {
  ok:     { text: "text-ok",     bar: "bg-ok",     badge: "text-ok bg-ok-soft" },
  warn:   { text: "text-warn",   bar: "bg-warn",   badge: "text-warn bg-warn-soft" },
  danger: { text: "text-danger", bar: "bg-danger", badge: "text-danger bg-danger-soft" },
} as const;

/* ── 스켈레톤 ── */
function Skeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-8 space-y-2">
        <div className="bg-surface h-3 w-16 animate-pulse rounded" />
        <div className="bg-surface h-7 w-32 animate-pulse rounded" />
      </div>
      <div className="mb-6 bg-surface h-16 animate-pulse rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-surface h-64 animate-pulse rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
