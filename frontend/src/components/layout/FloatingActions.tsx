"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * 우하단 플로팅 액션 — 문의 · 맨 위로.
 *
 * "맨 위로"는 어느 정도 내려갔을 때만 나타난다. 항상 떠 있으면
 * 좁은 화면에서 콘텐츠를 가리기만 한다.
 *
 * 스크롤 이동은 `prefers-reduced-motion` 을 존중한다 — smooth 스크롤은
 * 전정기관 민감한 사용자에게 어지럼증을 유발한다.
 */
export function FloatingActions({ inquiryHref = "/login" }: { inquiryHref?: string }) {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <div className="fixed right-4 bottom-6 z-40 flex flex-col items-center gap-2 print:hidden">
      <Link
        href={inquiryHref}
        className="bg-brand text-fg-on-brand rounded-[var(--radius-pill)] px-3.5 py-2.5 text-xs font-medium shadow-[var(--shadow-panel)] transition-opacity hover:opacity-90"
      >
        문의
      </Link>
      {showTop ? (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="맨 위로"
          className="bg-surface border-border text-fg-dim hover:text-fg rounded-[var(--radius-pill)] border px-3 py-2 text-xs transition-colors"
        >
          ↑
        </button>
      ) : null}
    </div>
  );
}
