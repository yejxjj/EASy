"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/primitives/Button";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { apiDeleteHistory, apiFetchHistory } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import type { HistoryItem } from "@/types/auth";

/**
 * 분석 기록 목록.
 *
 * 조판을 사이트의 나머지와 맞추면서 두 가지를 고쳤다:
 *
 *   · 등급을 점수로 다시 계산하고 있었다. 60/35 를 경계로 `신뢰 가능 /
 *     불확실 / AI 워싱` 이라는 이름을 새로 만들었는데, 대시보드는
 *     `risk_level`, 결과 화면은 `overall_label` 을 쓴다. 판정 이름이 세 벌
 *     있을 이유가 없어 백엔드 `risk_level` 을 그대로 쓴다.
 *   · 카드에 그림자와 hover 이동이 걸려 있었다. 상자를 걷고 괘선으로 나눈다.
 *
 * 남은 문제: 이 화면은 /dashboard 의 `분석 기록` 탭과 같은 목록이다.
 * 그쪽은 검색 · 정렬 · 비교 · 행 펼치기까지 있어 여기가 약한 중복이다.
 * 합칠지 여부는 따로 정해야 한다.
 */

function riskTone(level: string): string {
  const v = (level || "").trim();
  if (v.includes("매우 낮") || v === "낮음") return "var(--color-verified)";
  if (v.includes("보통")) return "var(--color-partial)";
  if (v.includes("높")) return "var(--color-missing)";
  return "var(--color-fg-faint)";
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, mounted } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!mounted) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    apiFetchHistory(user.token)
      .then(setItems)
      .catch(() => setError("기록을 불러오지 못했습니다. 다시 시도해 주세요."))
      .finally(() => setLoading(false));
  }, [mounted, user, router]);

  if (!mounted || loading) return <Skeleton />;

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    if (!confirm("이 분석 기록을 삭제할까요?")) return;
    await apiDeleteHistory(user.token, id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="bg-bg flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl px-5 py-14 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Analysis History</Eyebrow>
            <h1 className="text-fg mt-3 text-2xl font-medium tracking-[var(--tracking-heading)]">
              내 분석 기록
            </h1>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/dashboard">대시보드</Link>
          </Button>
        </div>

        {error ? (
          <p
            className="mt-8 border-t pt-4 text-xs leading-loose"
            style={{
              borderColor: "var(--color-missing)",
              color: "var(--color-missing)",
            }}
          >
            {error}
          </p>
        ) : null}

        {!error && items.length === 0 ? (
          <div className="border-border mt-8 border-y py-16 text-center">
            <p className="text-fg-dim text-sm">아직 분석 기록이 없습니다</p>
            <p className="text-fg-faint mt-1.5 text-xs">
              상품 URL을 넣으면 첫 분석이 시작됩니다
            </p>
            <Button asChild variant="secondary" size="sm" className="mt-5">
              <Link href="/">분석 시작하기</Link>
            </Button>
          </div>
        ) : null}

        {items.length > 0 ? (
          <ul className="border-border divide-border mt-8 divide-y border-y">
            {items.map((item) => {
              const color = riskTone(item.risk_level);
              return (
                <li key={item.id} className="group relative">
                  <Link
                    href={`/history/${item.id}`}
                    className="hover:bg-surface flex items-center gap-4 py-4 transition-colors"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="text-fg block truncate text-sm tracking-[var(--tracking-tight)]">
                        {item.product_name}
                      </span>
                      <span className="text-fg-dim mt-0.5 block truncate text-xs">
                        {item.company_name ? `${item.company_name} · ` : ""}
                        {item.created_at}
                      </span>
                    </span>

                    <span
                      className="hidden shrink-0 font-mono text-xs tracking-[var(--tracking-label)] sm:block"
                      style={{ color }}
                    >
                      {item.risk_level || "—"}
                    </span>
                    <span
                      className="tnum w-12 shrink-0 text-right text-sm font-medium"
                      style={{ color }}
                    >
                      {(item.accs_score ?? 0).toFixed(1)}
                    </span>
                    <span className="w-6 shrink-0" />
                  </Link>

                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    aria-label={`${item.product_name} 삭제`}
                    className={cn(
                      "text-fg-faint absolute top-1/2 right-0 -translate-y-1/2 px-1 text-xs transition-colors",
                      "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                      "hover:text-[color:var(--color-missing)]",
                    )}
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="bg-bg flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl px-5 py-14 md:px-8">
        <div className="bg-surface-strong h-3.5 w-28 animate-pulse rounded-full" />
        <div className="bg-surface-strong mt-4 h-7 w-44 animate-pulse rounded-full" />
        <div className="border-border mt-8 border-t">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border-border border-b py-5">
              <div className="bg-surface-strong h-3.5 w-[45%] animate-pulse rounded-full" />
              <div className="bg-surface-strong mt-2 h-3 w-[28%] animate-pulse rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
