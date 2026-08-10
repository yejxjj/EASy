"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { startAnalysis } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import { cn } from "@/lib/cn";

/**
 * 히어로의 URL 입력.
 *
 * 이 서비스의 유일한 진입점이라 검색바가 히어로의 주역이다.
 * 아래 카테고리 칩은 인기 분야로 가는 지름길.
 *
 * 기존 랜딩은 `document.getElementById("urlInput")` 로 값을 읽었다.
 * 여기서는 제어 컴포넌트로 바꿔 React 밖 상태를 만들지 않는다.
 */

const CATEGORIES = ["세탁기", "로봇청소기", "TV", "에어컨", "공기청정기"] as const;

interface HeroSearchProps {
  className?: string;
  onCategorySelect?: (category: string) => void;
}

export function HeroSearch({ className, onCategorySelect }: HeroSearchProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = url.trim();
    if (!value || busy) return;

    const token = getStoredToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const result = await startAnalysis(value, token);
      router.push(`/analysis/${result.analysis_id}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "분석 요청 중 오류가 발생했습니다.",
      );
      setBusy(false);
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <form
        onSubmit={handleSubmit}
        className="bg-surface flex w-full max-w-[420px] items-center gap-2 rounded-[var(--radius-pill)] p-1.5 pl-5"
      >
        <label htmlFor="hero-url" className="sr-only">
          검증할 상품 URL 또는 제품명
        </label>
        <input
          id="hero-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={busy}
          placeholder="검증할 상품 URL 또는 제품명"
          className="text-fg placeholder:text-fg-faint min-w-0 flex-1 bg-transparent text-sm outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !url.trim()}
          aria-label="검증 시작"
          className="bg-brand-fg text-fg-on-brand grid size-8 shrink-0 place-items-center rounded-full transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {busy ? (
            <span
              aria-hidden
              className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
            />
          ) : (
            <SearchIcon />
          )}
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-2.5 text-xs text-[color:var(--color-missing)]">
          {error}
        </p>
      ) : null}

      <ul className="mt-3.5 flex flex-wrap gap-1.5">
        {CATEGORIES.map((category) => (
          <li key={category}>
            <button
              type="button"
              onClick={() => onCategorySelect?.(category)}
              className="border-border text-fg-muted hover:text-fg hover:border-border-strong rounded-[var(--radius-pill)] border px-3 py-1 text-xs transition-colors"
            >
              {category}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9.2 9.2 12.5 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
