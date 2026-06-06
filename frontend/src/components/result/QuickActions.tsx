"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Download, RotateCcw, Share2, Bookmark, BookmarkCheck } from "lucide-react";

import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { apiAddWatchlist } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth";
import type { AnalysisResult } from "@/types/analysis";

interface QuickActionsProps {
  data: AnalysisResult;
  historyId?: number;
}

export function QuickActions({ data, historyId }: QuickActionsProps) {
  const { user } = useAuth();
  const [toast,      setToast]      = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [bmBusy,     setBmBusy]     = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(""), 2200);
  }

  function handleShare() {
    const url = historyId
      ? `${window.location.origin}/history/${historyId}`
      : window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => showToast("링크가 클립보드에 복사됐습니다"))
      .catch(() => showToast("복사 실패 — 주소창에서 직접 복사해 주세요"));
  }

  function handlePdf() {
    window.print();
  }

  async function handleBookmark() {
    if (!user || bookmarked || bmBusy) return;
    setBmBusy(true);
    try {
      const url = historyId
        ? `${window.location.origin}/history/${historyId}`
        : window.location.href;
      await apiAddWatchlist(user.token, url, data.product.name || "");
      setBookmarked(true);
      showToast("북마크에 저장됐습니다");
    } catch {
      showToast("북마크 저장에 실패했습니다");
    } finally {
      setBmBusy(false);
    }
  }

  return (
    <>
      <Card>
        <SectionHeader eyebrow="actions" title="빠른 작업" />
        <div className="flex flex-col gap-2 px-5 pt-1 pb-5">
          {/* 새 분석 */}
          <Button asChild variant="cta" size="lg" className="w-full">
            <Link href="/">
              <RotateCcw size={16} aria-hidden />
              새 분석 시작
            </Link>
          </Button>

          {/* 링크 공유 */}
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full"
            onClick={handleShare}
          >
            <Share2 size={14} aria-hidden />
            링크 공유
          </Button>

          {/* PDF 다운로드 */}
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full"
            onClick={handlePdf}
          >
            <Download size={14} aria-hidden />
            PDF 다운로드
          </Button>

          {/* 북마크 */}
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full"
            onClick={handleBookmark}
            disabled={bookmarked || bmBusy || !user}
            style={bookmarked ? { borderColor: "rgba(217,119,6,.35)", color: "#b45309", background: "rgba(217,119,6,.07)" } : {}}
          >
            {bookmarked
              ? <><BookmarkCheck size={14} aria-hidden /> 북마크 저장됨</>
              : <><Bookmark size={14} aria-hidden /> {bmBusy ? "저장 중…" : "북마크에 저장"}</>
            }
          </Button>
        </div>
      </Card>

      {/* 토스트 */}
      {toast && (
        <div
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0e1120",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 500,
            fontFamily: "'Inter', -apple-system, sans-serif",
            zIndex: 300,
            whiteSpace: "nowrap",
            boxShadow: "0 8px 24px rgba(14,17,32,.2)",
            animation: "qaToastIn .2s ease",
          }}
        >
          <style>{`@keyframes qaToastIn { from { opacity:0; transform:translateX(-50%) translateY(8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
          {toast}
        </div>
      )}
    </>
  );
}
