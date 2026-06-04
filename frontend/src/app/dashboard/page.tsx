"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import {
  apiAddWatchlist,
  apiDeleteWatchlist,
  apiFetchHistory,
  apiFetchWatchlist,
} from "@/lib/api/auth";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import type { HistoryItem, WatchlistItem } from "@/types/auth";

/* ── 점수 유틸 ── */
function tier(score: number): "ok" | "warn" | "danger" {
  return score >= 60 ? "ok" : score >= 35 ? "warn" : "danger";
}
const TIER_LABEL = { ok: "신뢰 가능", warn: "불확실", danger: "AI 워싱" } as const;
const TIER_CLS = {
  ok:     { text: "text-ok",     badge: "text-ok bg-ok-soft" },
  warn:   { text: "text-warn",   badge: "text-warn bg-warn-soft" },
  danger: { text: "text-danger", badge: "text-danger bg-danger-soft" },
} as const;

export default function DashboardPage() {
  const router           = useRouter();
  const { user, mounted } = useAuth();

  const [history,   setHistory]   = useState<HistoryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<WatchlistItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  /* 비교 선택 상태 */
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!mounted) return;
    if (!user) { router.replace("/login"); return; }

    Promise.all([
      apiFetchHistory(user.token),
      apiFetchWatchlist(user.token),
    ])
      .then(([h, b]) => { setHistory(h.slice(0, 6)); setBookmarks(b); })
      .catch((e) => setError(e instanceof Error ? e.message : "불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [mounted, user, router]);

  if (!mounted || loading) return <Skeleton />;

  /* 비교 선택 토글 */
  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else if (next.size < 3) { next.add(id); }
      return next;
    });
  }

  /* 비교하기 이동 */
  function goCompare() {
    const ids = [...selected].join(",");
    router.push(`/compare?ids=${ids}`);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">

      {/* 헤더 */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="mono-eyebrow mb-1">Dashboard</p>
          <h1 className="text-fg text-2xl font-bold tracking-tight">내 대시보드</h1>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/">← 홈으로</Link>
        </Button>
      </div>

      {error && (
        <p className="text-danger mb-6 rounded-xl bg-danger-soft px-4 py-3 text-sm">{error}</p>
      )}

      {/* ── 최근 분석 ── */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="mono-eyebrow mb-0.5">Recent Analyses</p>
            <h2 className="text-fg text-base font-semibold">최근 분석</h2>
          </div>
          <div className="flex items-center gap-2">
            {selected.size >= 2 && (
              <Button variant="cta" size="sm" onClick={goCompare}>
                {selected.size}개 비교하기 →
              </Button>
            )}
            {selected.size === 1 && (
              <span className="mono-eyebrow">2~3개 선택하면 비교 가능</span>
            )}
            <Button asChild variant="ghost" size="sm">
              <Link href="/history">전체 보기 →</Link>
            </Button>
          </div>
        </div>

        {history.length === 0 ? (
          <Card className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="text-4xl">🔍</span>
            <p className="text-fg-muted text-sm">아직 분석 기록이 없습니다</p>
            <Button asChild variant="cta" size="sm">
              <Link href="/">첫 분석 시작하기 →</Link>
            </Button>
          </Card>
        ) : (
          <>
            {selected.size > 0 && (
              <p className="mono-eyebrow mb-3">
                {selected.size}개 선택됨 (최대 3개) — 카드를 클릭해 선택/해제
              </p>
            )}
            {selected.size === 0 && (
              <p className="mono-eyebrow mb-3">카드를 클릭하면 비교할 제품을 선택할 수 있어요</p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {history.map((item) => {
                const t   = tier(item.accs_score);
                const cls = TIER_CLS[t];
                const sel = selected.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative rounded-[var(--radius-card)] border p-4 transition-all",
                      sel
                        ? "border-brand bg-brand-soft shadow-[var(--shadow-glow-brand)]"
                        : "border-border bg-bg hover:border-brand/40 hover:shadow-[var(--shadow-card)]",
                    )}
                  >
                    {/* 비교 선택 체크박스 */}
                    <button
                      type="button"
                      onClick={() => toggleSelect(item.id)}
                      title="비교 선택"
                      className={cn(
                        "absolute right-3 top-3 flex size-5 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors",
                        sel
                          ? "border-brand bg-brand text-white"
                          : "border-border-strong text-transparent hover:border-brand/60",
                      )}
                    >
                      ✓
                    </button>

                    {/* 카드 본문 — 클릭 시 상세 보기 */}
                    <Link href={`/history/${item.id}`} className="block pr-6">
                      <p className="text-fg text-sm font-semibold leading-snug">
                        {item.product_name}
                      </p>
                      <p className="text-fg-subtle mt-0.5 font-mono text-xs">
                        {item.company_name || "브랜드 미상"} · {item.created_at}
                      </p>

                      <div className="mt-3 flex items-center justify-between">
                        <span className={cn("rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold", cls.badge)}>
                          {TIER_LABEL[t]}
                        </span>
                        <span className={cn("font-mono text-xl font-extrabold tabular-nums", cls.text)}>
                          {item.accs_score.toFixed(1)}
                        </span>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* ── 북마크 ── */}
      <section>
        <div className="mb-4">
          <p className="mono-eyebrow mb-0.5">Bookmarks</p>
          <h2 className="text-fg text-base font-semibold">북마크</h2>
        </div>

        <Card>
          {/* 추가 폼 */}
          <AddBookmarkForm
            token={user!.token}
            onAdd={(item) => setBookmarks((prev) => [item, ...prev])}
          />

          {/* 목록 */}
          {bookmarks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="text-2xl">★</span>
              <p className="text-fg-muted text-sm">저장된 북마크가 없습니다</p>
              <p className="text-fg-dim text-xs">분석하고 싶은 제품 URL을 저장해 두세요</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {bookmarks.map((bm) => (
                <BookmarkRow
                  key={bm.id}
                  item={bm}
                  token={user!.token}
                  onDelete={(id) => setBookmarks((prev) => prev.filter((b) => b.id !== id))}
                />
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}

/* ── 북마크 추가 폼 ── */
function AddBookmarkForm({
  token,
  onAdd,
}: {
  token: string;
  onAdd: (item: WatchlistItem) => void;
}) {
  const [url,  setUrl]  = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState("");
  const urlRef = useRef<HTMLInputElement>(null);

  async function handleAdd() {
    if (!url.trim()) { setErr("URL을 입력해 주세요."); return; }
    setBusy(true); setErr("");
    try {
      const item = await apiAddWatchlist(token, url.trim(), name.trim());
      onAdd(item);
      setUrl(""); setName("");
      urlRef.current?.focus();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "추가 실패");
    } finally {
      setBusy(false);
    }
  }

  const inputCls = cn(
    "bg-surface border-border h-10 rounded-xl border px-3 text-sm text-fg",
    "placeholder:text-fg-dim outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/15",
  );

  return (
    <div className="border-b border-border px-5 py-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          ref={urlRef}
          type="url"
          placeholder="https://prod.danawa.com/info/?pcode=…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className={cn(inputCls, "flex-1")}
        />
        <input
          type="text"
          placeholder="제품 이름 (선택)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className={cn(inputCls, "sm:w-44")}
        />
        <Button variant="cta" size="sm" onClick={handleAdd} disabled={busy} className="h-10 shrink-0">
          {busy ? "저장 중…" : "+ 저장"}
        </Button>
      </div>
      {err && <p className="text-danger mt-2 text-xs">{err}</p>}
    </div>
  );
}

/* ── 북마크 행 ── */
function BookmarkRow({
  item,
  token,
  onDelete,
}: {
  item: WatchlistItem;
  token: string;
  onDelete: (id: number) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleAnalyze() {
    setBusy(true);
    try {
      const { startAnalysis } = await import("@/lib/api");
      const { analysis_id } = await startAnalysis(item.url, token);
      router.push(`/analysis/${analysis_id}`);
    } catch {
      setBusy(false);
    }
  }

  async function handleDelete() {
    await apiDeleteWatchlist(token, item.id);
    onDelete(item.id);
  }

  return (
    <li className="flex items-center gap-3 px-5 py-3.5">
      <span className="text-warn text-base">★</span>
      <div className="min-w-0 flex-1">
        <p className="text-fg truncate text-sm font-semibold">
          {item.product_name || "제품명 미설정"}
        </p>
        <p className="text-fg-dim truncate font-mono text-xs">{item.url}</p>
      </div>
      <span className="text-fg-dim shrink-0 font-mono text-xs">{item.added_at}</span>
      <Button variant="cta" size="sm" onClick={handleAnalyze} disabled={busy} className="shrink-0">
        {busy ? "…" : "분석 →"}
      </Button>
      <button
        onClick={handleDelete}
        className="text-fg-dim hover:text-danger shrink-0 text-sm transition-colors"
        aria-label="삭제"
      >
        ✕
      </button>
    </li>
  );
}

/* ── 스켈레톤 ── */
function Skeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-8 space-y-2">
        <div className="bg-surface h-3 w-20 animate-pulse rounded" />
        <div className="bg-surface h-7 w-40 animate-pulse rounded" />
      </div>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface h-28 animate-pulse rounded-2xl" />
        ))}
      </div>
      <div className="bg-surface h-48 animate-pulse rounded-2xl" />
    </div>
  );
}
