"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  apiAddWatchlist,
  apiDeleteWatchlist,
  apiFetchHistory,
  apiFetchWatchlist,
} from "@/lib/api/auth";
import { useAuth } from "@/lib/auth";
import type { HistoryItem, WatchlistItem } from "@/types/auth";

/* ── 점수 유틸 ── */
function tier(score: number): "safe" | "ok" | "warn" | "danger" | "critical" {
  if (score >= 80) return "safe";
  if (score >= 60) return "ok";
  if (score >= 40) return "warn";
  if (score >= 20) return "danger";
  return "critical";
}

const TIER_LABEL = {
  safe: "Safe", ok: "Low", warn: "Medium", danger: "High", critical: "Critical",
} as const;

const TIER_COLOR = {
  safe:     { bg: "rgba(5,150,105,.1)",   border: "rgba(5,150,105,.25)",   text: "#059669" },
  ok:       { bg: "rgba(37,99,235,.08)",  border: "rgba(37,99,235,.2)",   text: "#2563eb" },
  warn:     { bg: "rgba(217,119,6,.09)",  border: "rgba(217,119,6,.22)",  text: "#b45309" },
  danger:   { bg: "rgba(220,38,38,.08)",  border: "rgba(220,38,38,.2)",   text: "#dc2626" },
  critical: { bg: "rgba(185,28,28,.1)",   border: "rgba(185,28,28,.25)",  text: "#b91c1c" },
} as const;

const STATUS_DOT = {
  completed: { color: "#16a34a", label: "COMPLETE" },
  running:   { color: "#d97706", label: "RUNNING"  },
  failed:    { color: "#dc2626", label: "FAILED"   },
  queued:    { color: "#6b7280", label: "QUEUED"   },
} as const;

function getStatus(item: HistoryItem): keyof typeof STATUS_DOT {
  return (item as HistoryItem & { status?: string }).status as keyof typeof STATUS_DOT ?? "completed";
}

function formatDate(s: string) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function getCategory(item: HistoryItem) {
  return item.category?.trim() || "AI 제품";
}

/* ── 스타일 ── */
const CSS = `
.db-page {
  min-height: 100vh;
  background: #f4f6fb;
  font-family: 'Inter', -apple-system, sans-serif;
}
.db-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 32px;
}
.db-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 36px;
}
.db-title {
  font-size: 13px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: rgba(14,17,32,.38);
  margin-bottom: 6px;
  font-weight: 400;
}
.db-h1 {
  font-size: 28px;
  font-weight: 600;
  color: #0e1120;
  letter-spacing: -.01em;
}
.db-head-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.db-btn {
  font-size: 14px;
  font-weight: 400;
  padding: 8px 18px;
  border-radius: 8px;
  border: 1px solid rgba(14,17,32,.15);
  background: #fff;
  color: rgba(14,17,32,.65);
  cursor: pointer;
  transition: all .2s;
  font-family: inherit;
  letter-spacing: .01em;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.db-btn:hover { border-color: rgba(14,17,32,.3); color: #0e1120; background: #fff; }
.db-btn-primary {
  background: #0e1120;
  color: #fff;
  border-color: #0e1120;
}
.db-btn-primary:hover { background: #1a2035; color: #fff; border-color: #1a2035; }
.db-btn-compare {
  background: rgba(37,99,235,.07);
  border-color: rgba(37,99,235,.22);
  color: #2563eb;
}
.db-btn-compare:hover { background: rgba(37,99,235,.13); border-color: rgba(37,99,235,.4); color: #1d4ed8; }
.db-btn-compare.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}
.db-btn-compare.active:hover { background: #1d4ed8; border-color: #1d4ed8; color: #fff; }

/* TABS */
.db-tabs {
  display: flex;
  align-items: center;
  gap: 0;
  border-bottom: 1px solid rgba(14,17,32,.09);
  margin-bottom: 24px;
}
.db-tab {
  font-size: 14px;
  letter-spacing: .06em;
  padding: 10px 20px;
  color: rgba(14,17,32,.42);
  cursor: pointer;
  border: none;
  background: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all .2s;
  font-family: inherit;
  font-weight: 400;
}
.db-tab.active {
  color: #0e1120;
  border-bottom-color: #0e1120;
  font-weight: 500;
}
.db-tab:hover:not(.active) { color: rgba(14,17,32,.68); }

/* TABLE */
.db-table-wrap {
  background: #fff;
  border: 1px solid rgba(14,17,32,.09);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(14,17,32,.05);
}
.db-col-heads {
  display: grid;
  padding: 0 24px;
  border-bottom: 1px solid rgba(14,17,32,.08);
  background: #f9fafb;
}
.db-col-head {
  font-size: 12px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: rgba(14,17,32,.32);
  padding: 14px 8px;
  font-weight: 500;
}
.db-row {
  display: grid;
  padding: 0 24px;
  border-bottom: 1px solid rgba(14,17,32,.06);
  align-items: center;
  transition: background .15s;
  position: relative;
}
.db-row:last-child { border-bottom: none; }
.db-row:hover { background: rgba(37,99,235,.018); }
.db-row.selected {
  background: rgba(37,99,235,.04);
  border-left: 2px solid #2563eb;
  margin-left: -2px;
}
.db-row-cell {
  padding: 20px 8px;
}
.db-row-main {
  display: flex;
  align-items: flex-start;
  padding: 20px 8px 20px 0;
  text-decoration: none;
  color: inherit;
  min-width: 0;
}
.db-row-main:hover .db-product-name {
  color: #2563eb;
}
.db-product-name {
  font-size: 16px;
  font-weight: 600;
  color: #0e1120;
  line-height: 1.35;
  margin-bottom: 3px;
  transition: color .15s;
}
.db-product-brand {
  font-size: 14px;
  color: rgba(14,17,32,.42);
  margin-bottom: 6px;
}
.db-product-stats {
  font-size: 13px;
  color: rgba(14,17,32,.38);
  display: flex;
  gap: 10px;
  align-items: center;
  letter-spacing: .02em;
}
.db-product-stat-val {
  font-weight: 600;
  color: rgba(14,17,32,.58);
}
.db-badge {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: .06em;
  padding: 4px 10px;
  border-radius: 20px;
  white-space: nowrap;
  border: 1px solid;
}
.db-badge-type {
  background: rgba(37,99,235,.07);
  border-color: rgba(37,99,235,.2);
  color: #2563eb;
  border-radius: 6px;
  font-size: 12px;
  padding: 4px 10px;
  white-space: nowrap;
}
.db-status {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  letter-spacing: .06em;
  font-weight: 500;
}
.db-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.db-severity-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.db-severity-num {
  font-size: 15px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: #0e1120;
  min-width: 24px;
}
.db-severity-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 3px 9px;
  border-radius: 5px;
  border: 1px solid;
  letter-spacing: .04em;
}
.db-perf {
  font-size: 14px;
  color: rgba(14,17,32,.68);
  line-height: 1.6;
}
.db-perf strong {
  font-size: 15px;
  font-weight: 600;
  color: #0e1120;
}
.db-date {
  font-size: 14px;
  color: rgba(14,17,32,.55);
  line-height: 1.6;
  font-family: 'JetBrains Mono', monospace;
}

/* COMPARE CHECKBOX */
.db-cb-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 4px;
}
.db-cb {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1.5px solid rgba(14,17,32,.22);
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: transparent;
  transition: all .18s;
  flex-shrink: 0;
}
.db-cb.checked {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}
.db-cb:hover:not(.checked) {
  border-color: rgba(37,99,235,.4);
  background: rgba(37,99,235,.05);
}

/* EMPTY */
.db-empty {
  text-align: center;
  padding: 64px 24px;
}
.db-empty-icon { font-size: 36px; margin-bottom: 14px; }
.db-empty-text { font-size: 16px; color: rgba(14,17,32,.42); margin-bottom: 20px; }

/* COMPARE BAR */
.db-compare-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #0e1120;
  color: #fff;
  border-radius: 12px;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 15px;
  box-shadow: 0 8px 32px rgba(14,17,32,.25);
  z-index: 100;
  animation: slideUp .25s ease;
}
@keyframes slideUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
.db-compare-btn {
  background: #fff;
  color: #0e1120;
  border: none;
  border-radius: 8px;
  padding: 7px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background .15s;
}
.db-compare-btn:hover { background: #f0f0f0; }
.db-compare-close {
  background: none;
  border: none;
  color: rgba(255,255,255,.55);
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  line-height: 1;
  transition: color .15s;
}
.db-compare-close:hover { color: #fff; }

/* BOOKMARK SECTION */
.db-bm-box {
  background: #fff;
  border: 1px solid rgba(14,17,32,.09);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(14,17,32,.05);
}
.db-bm-add {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(14,17,32,.07);
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.db-bm-input {
  flex: 1;
  min-width: 200px;
  height: 38px;
  background: #f8f9fc;
  border: 1px solid rgba(14,17,32,.11);
  border-radius: 8px;
  padding: 0 12px;
  font-size: 14px;
  color: #0e1120;
  font-family: inherit;
  outline: none;
  transition: border-color .2s, box-shadow .2s;
}
.db-bm-input::placeholder { color: rgba(14,17,32,.28); }
.db-bm-input:focus { border-color: rgba(37,99,235,.35); box-shadow: 0 0 0 3px rgba(37,99,235,.07); background: #fff; }
.db-bm-add-btn {
  height: 38px;
  padding: 0 16px;
  background: #0e1120;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background .2s;
  white-space: nowrap;
}
.db-bm-add-btn:hover { background: #1a2035; }
.db-bm-add-btn:disabled { background: rgba(14,17,32,.2); cursor: not-allowed; }
.db-bm-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(14,17,32,.06);
}
.db-bm-row:last-child { border-bottom: none; }
.db-bm-star { color: #d97706; font-size: 16px; flex-shrink: 0; }
.db-bm-info { flex: 1; min-width: 0; }
.db-bm-name { font-size: 15px; font-weight: 500; color: #0e1120; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.db-bm-url { font-size: 13px; color: rgba(14,17,32,.35); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'JetBrains Mono', monospace; }
.db-bm-date { font-size: 13px; color: rgba(14,17,32,.3); flex-shrink: 0; }
.db-bm-analyze {
  height: 32px;
  padding: 0 14px;
  background: rgba(37,99,235,.08);
  color: #2563eb;
  border: 1px solid rgba(37,99,235,.2);
  border-radius: 7px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all .2s;
  flex-shrink: 0;
}
.db-bm-analyze:hover { background: rgba(37,99,235,.14); }
.db-bm-del {
  background: none;
  border: none;
  color: rgba(14,17,32,.25);
  cursor: pointer;
  font-size: 16px;
  padding: 0 4px;
  transition: color .2s;
  flex-shrink: 0;
}
.db-bm-del:hover { color: #dc2626; }
.db-bm-empty {
  text-align: center;
  padding: 40px 24px;
  color: rgba(14,17,32,.32);
  font-size: 15px;
}

/* TOOLBAR */
.db-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.db-search-wrap {
  flex: 1;
  min-width: 180px;
  position: relative;
}
.db-search-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 15px;
  color: rgba(14,17,32,.3);
  pointer-events: none;
}
.db-search-input {
  width: 100%;
  height: 36px;
  background: #fff;
  border: 1px solid rgba(14,17,32,.12);
  border-radius: 9px;
  padding: 0 12px 0 32px;
  font-size: 14px;
  color: #0e1120;
  font-family: inherit;
  outline: none;
  transition: border-color .2s, box-shadow .2s;
  box-sizing: border-box;
}
.db-search-input::placeholder { color: rgba(14,17,32,.28); }
.db-search-input:focus { border-color: rgba(37,99,235,.35); box-shadow: 0 0 0 3px rgba(37,99,235,.07); }
.db-sort-group {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid rgba(14,17,32,.12);
  border-radius: 9px;
  overflow: hidden;
}
.db-sort-btn {
  height: 36px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 400;
  letter-spacing: .02em;
  color: rgba(14,17,32,.45);
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: all .15s;
  white-space: nowrap;
}
.db-sort-btn + .db-sort-btn {
  border-left: 1px solid rgba(14,17,32,.09);
}
.db-sort-btn:hover { color: #0e1120; background: rgba(14,17,32,.03); }
.db-sort-btn.active { color: #0e1120; font-weight: 500; background: rgba(14,17,32,.04); }

/* SKELETON */
.db-skeleton { background: #edf0f8; border-radius: 8px; animation: shimmer 1.4s ease infinite; }
@keyframes shimmer { 0%,100% { opacity: 1; } 50% { opacity: .55; } }
`;

const COLS_NORMAL  = "1fr 130px 110px 120px 160px 140px";
const COLS_COMPARE = "32px 1fr 130px 110px 120px 160px 140px";

export default function DashboardPage() {
  const router = useRouter();
  const { user, mounted } = useAuth();

  const [history,     setHistory]     = useState<HistoryItem[]>([]);
  const [bookmarks,   setBookmarks]   = useState<WatchlistItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [activeTab,   setActiveTab]   = useState<"records" | "bookmarks">("records");
  const [compareMode, setCompareMode] = useState(false);
  const [selected,    setSelected]    = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder,   setSortOrder]   = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    if (!mounted) return;
    if (!user) { router.replace("/login"); return; }
    Promise.all([apiFetchHistory(user.token), apiFetchWatchlist(user.token)])
      .then(([h, b]) => { setHistory(h.slice(0, 10)); setBookmarks(b); })
      .catch((e) => setError(e instanceof Error ? e.message : "불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [mounted, user, router]);

  if (!mounted || loading) return <DbSkeleton />;

  function toggleSelect(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  }

  function toggleCompareMode() {
    setCompareMode(m => !m);
    setSelected(new Set());
  }

  // 검색 + 정렬 적용
  const filteredHistory = history
    .filter(item => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        item.product_name.toLowerCase().includes(q) ||
        (item.company_name || "").toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? tb - ta : ta - tb;
    });

  const seqMap = new Map(history.map((item, i) => [item.id, String(i + 1).padStart(2, "0")]));
  const cols = compareMode ? COLS_COMPARE : COLS_NORMAL;

  return (
    <div className="db-page">
      <style>{CSS}</style>
      <div className="db-inner">

        {/* HEAD */}
        <div className="db-head">
          <div>
            <div className="db-title">Dashboard</div>
            <h1 className="db-h1">분석 현황</h1>
          </div>
          <div className="db-head-actions">
            <Link href="/" className="db-btn db-btn-primary">+ 새 분석</Link>
            <button
              className={`db-btn db-btn-compare${compareMode ? " active" : ""}`}
              onClick={toggleCompareMode}
            >
              {compareMode ? "선택 취소" : "비교보기"}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: "rgba(220,38,38,.07)", border: "1px solid rgba(220,38,38,.18)", borderRadius: 10, color: "#dc2626", fontSize: 15, padding: "12px 16px", marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* TABS */}
        <div className="db-tabs">
          <button className={`db-tab ${activeTab === "records" ? "active" : ""}`}
            onClick={() => setActiveTab("records")}>
            분석 기록 ({history.length})
          </button>
          <button className={`db-tab ${activeTab === "bookmarks" ? "active" : ""}`}
            onClick={() => setActiveTab("bookmarks")}>
            북마크 ({bookmarks.length})
          </button>
        </div>

        {/* ── 분석 기록 탭 ── */}
        {activeTab === "records" && (
          <>
            {/* 검색 + 정렬 툴바 */}
            <div className="db-toolbar">
              <div className="db-search-wrap">
                <span className="db-search-icon">⌕</span>
                <input
                  type="text"
                  className="db-search-input"
                  placeholder="제품명, 브랜드, 카테고리 검색…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="db-sort-group">
                <button
                  className={`db-sort-btn${sortOrder === "newest" ? " active" : ""}`}
                  onClick={() => setSortOrder("newest")}
                >최신순</button>
                <button
                  className={`db-sort-btn${sortOrder === "oldest" ? " active" : ""}`}
                  onClick={() => setSortOrder("oldest")}
                >오래된순</button>
              </div>
            </div>

          <div className="db-table-wrap">
            {/* Column Headers */}
            <div className="db-col-heads" style={{ gridTemplateColumns: cols }}>
              {compareMode && <div className="db-col-head" />}
              <div className="db-col-head">분석 항목</div>
              <div className="db-col-head">카테고리</div>
              <div className="db-col-head">상태</div>
              <div className="db-col-head">위험도</div>
              <div className="db-col-head">성능</div>
              <div className="db-col-head">분석 일시</div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="db-empty">
                <div className="db-empty-icon">🔍</div>
                <p className="db-empty-text">{searchQuery ? "검색 결과가 없습니다" : "아직 분석 기록이 없습니다"}</p>
                {!searchQuery && <Link href="/" className="db-btn db-btn-primary" style={{ display: "inline-flex" }}>첫 분석 시작하기 →</Link>}
              </div>
            ) : (
              filteredHistory.map((item) => {
                const t = tier(item.accs_score);
                const tc = TIER_COLOR[t];
                const st = getStatus(item);
                const sd = STATUS_DOT[st] ?? STATUS_DOT.completed;
                const sel = selected.has(item.id);
                const seq = seqMap.get(item.id) ?? "--";
                const category = getCategory(item);

                return (
                  <div
                    key={item.id}
                    className={`db-row${sel ? " selected" : ""}`}
                    style={{ gridTemplateColumns: cols }}
                  >
                    {/* 비교 체크박스 */}
                    {compareMode && (
                      <div className="db-cb-cell">
                        <div
                          className={`db-cb${sel ? " checked" : ""}`}
                          onClick={() => toggleSelect(item.id)}
                        >
                          {sel && "✓"}
                        </div>
                      </div>
                    )}

                    {/* 분석 항목 — 클릭하면 상세 페이지로 */}
                    <Link href={`/history/${item.id}`} className="db-row-main">
                      <div>
                        <div className="db-product-name">{item.product_name}</div>
                        <div className="db-product-brand">{item.company_name || "브랜드 미상"}</div>
                        <div className="db-product-stats">
                          <span><span className="db-product-stat-val">{item.accs_score.toFixed(1)}</span> ACCS</span>
                        </div>
                      </div>
                    </Link>

                    {/* 카테고리 */}
                    <div className="db-row-cell">
                      <span className="db-badge-type">{category}</span>
                    </div>

                    {/* 상태 */}
                    <div className="db-row-cell">
                      <div className="db-status">
                        <div className="db-status-dot" style={{ background: sd.color }} />
                        <span style={{ color: sd.color, fontSize: 13 }}>{sd.label}</span>
                      </div>
                    </div>

                    {/* 위험도 */}
                    <div className="db-row-cell">
                      <div className="db-severity-wrap">
                        <span className="db-severity-num">{seq}</span>
                        <span className="db-severity-badge" style={{ background: tc.bg, borderColor: tc.border, color: tc.text }}>
                          {TIER_LABEL[t]}
                        </span>
                      </div>
                    </div>

                    {/* 성능 */}
                    <div className="db-row-cell">
                      <div className="db-perf">
                        <strong>신뢰도 {item.accs_score.toFixed(1)}%</strong>
                      </div>
                    </div>

                    {/* 분석 일시 */}
                    <div className="db-row-cell">
                      <div className="db-date">
                        {formatDate(item.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          </>
        )}

        {/* ── 북마크 탭 ── */}
        {activeTab === "bookmarks" && (
          <div className="db-bm-box">
            <AddBookmarkForm
              token={user!.token}
              onAdd={(item) => setBookmarks(prev => [item, ...prev])}
            />
            {bookmarks.length === 0 ? (
              <div className="db-bm-empty">저장된 북마크가 없습니다</div>
            ) : (
              bookmarks.map((bm) => (
                <BookmarkRow key={bm.id} item={bm} token={user!.token}
                  onDelete={(id) => setBookmarks(prev => prev.filter(b => b.id !== id))} />
              ))
            )}
          </div>
        )}
      </div>

      {/* 비교 플로팅 바 */}
      {compareMode && selected.size >= 2 && (
        <div className="db-compare-bar">
          <span style={{ color: "rgba(255,255,255,.7)" }}>
            <strong style={{ color: "#fff" }}>{selected.size}개</strong> 선택됨
          </span>
          <button className="db-compare-btn"
            onClick={() => router.push(`/compare?ids=${[...selected].join(",")}`)}>
            비교하기 →
          </button>
          <button className="db-compare-close" onClick={() => setSelected(new Set())}>✕</button>
        </div>
      )}
    </div>
  );
}

/* ── 북마크 추가 폼 ── */
function AddBookmarkForm({ token, onAdd }: { token: string; onAdd: (i: WatchlistItem) => void }) {
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
      onAdd(item); setUrl(""); setName(""); urlRef.current?.focus();
    } catch (e) { setErr(e instanceof Error ? e.message : "추가 실패"); }
    finally { setBusy(false); }
  }

  return (
    <div className="db-bm-add">
      <input ref={urlRef} type="url" placeholder="https://prod.danawa.com/info/?pcode=…"
        value={url} onChange={e => setUrl(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleAdd()}
        className="db-bm-input" style={{ flex: 2 }} />
      <input type="text" placeholder="제품 이름 (선택)"
        value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleAdd()}
        className="db-bm-input" style={{ flex: 1, minWidth: 120 }} />
      <button onClick={handleAdd} disabled={busy} className="db-bm-add-btn">
        {busy ? "저장 중…" : "+ 저장"}
      </button>
      {err && <p style={{ width: "100%", fontSize: 13, color: "#dc2626", margin: 0 }}>{err}</p>}
    </div>
  );
}

/* ── 북마크 행 ── */
function BookmarkRow({ item, token, onDelete }: { item: WatchlistItem; token: string; onDelete: (id: number) => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleAnalyze() {
    setBusy(true);
    try {
      const { startAnalysis } = await import("@/lib/api");
      const { analysis_id } = await startAnalysis(item.url, token);
      router.push(`/analysis/${analysis_id}`);
    } catch { setBusy(false); }
  }

  return (
    <div className="db-bm-row">
      <span className="db-bm-star">★</span>
      <div className="db-bm-info">
        <div className="db-bm-name">{item.product_name || "제품명 미설정"}</div>
        <div className="db-bm-url">{item.url}</div>
      </div>
      <span className="db-bm-date">{item.added_at}</span>
      <button onClick={handleAnalyze} disabled={busy} className="db-bm-analyze">
        {busy ? "…" : "분석 →"}
      </button>
      <button onClick={() => { apiDeleteWatchlist(token, item.id); onDelete(item.id); }} className="db-bm-del">✕</button>
    </div>
  );
}

/* ── 스켈레톤 ── */
function DbSkeleton() {
  return (
    <div style={{ background: "#f4f6fb", minHeight: "100vh", padding: "40px 32px" }}>
      <style>{`.db-skeleton { background: #edf0f8; border-radius: 8px; animation: shimmer 1.4s ease infinite; } @keyframes shimmer { 0%,100%{opacity:1}50%{opacity:.55} }`}</style>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="db-skeleton" style={{ height: 28, width: 160, marginBottom: 8 }} />
        <div className="db-skeleton" style={{ height: 18, width: 80, marginBottom: 36 }} />
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(14,17,32,.09)", overflow: "hidden" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 16, padding: "20px 24px", borderBottom: "1px solid rgba(14,17,32,.06)" }}>
              <div style={{ flex: 1 }}>
                <div className="db-skeleton" style={{ height: 14, width: "60%", marginBottom: 8 }} />
                <div className="db-skeleton" style={{ height: 11, width: "35%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
