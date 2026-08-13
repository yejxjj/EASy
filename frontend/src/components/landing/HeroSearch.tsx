"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { startAnalysis } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import { cn } from "@/lib/cn";

/**
 * URL 입력 — 이 서비스의 유일한 진입점.
 *
 * 다나와 상품 URL만 받는다. 크롤러가 다나와 페이지 구조에만 맞춰져 있어서
 * 다른 쇼핑몰 URL을 넣으면 분석이 시작된 뒤에야 실패한다. 그래서 보내기
 * 전에 여기서 막는다.
 *
 * 기존 랜딩은 `document.getElementById("urlInput")` 로 값을 읽었다.
 * 여기서는 제어 컴포넌트로 두어 React 밖 상태를 만들지 않는다.
 */

const CATEGORIES = ["세탁기", "로봇청소기", "TV", "에어컨", "공기청정기"] as const;

const PLACEHOLDER = "https://prod.danawa.com/info/?pcode=…";

/** 다나와 상품 페이지인지 확인한다. www·prod 등 서브도메인은 모두 허용. */
function isDanawaProductUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  return /(^|\.)danawa\.com$/i.test(parsed.hostname);
}

interface HeroSearchProps {
  className?: string;
  /** 카테고리 칩을 감춘다 */
  hideCategories?: boolean;
}

export function HeroSearch({ className, hideCategories }: HeroSearchProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = url.trim();
    if (!value || busy) return;

    if (!isDanawaProductUrl(value)) {
      setError("다나와 상품 URL만 분석할 수 있습니다. 예: prod.danawa.com/info/?pcode=…");
      return;
    }

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
        className="flex w-full max-w-[440px] items-center gap-2 rounded-[var(--radius-pill)] bg-white p-1.5 pl-5"
      >
        <label htmlFor="hero-url" className="sr-only">
          다나와 상품 URL
        </label>
        <input
          id="hero-url"
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError(null);
          }}
          disabled={busy}
          placeholder={PLACEHOLDER}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "hero-url-error" : undefined}
          className="min-w-0 flex-1 bg-transparent text-sm text-[color:var(--color-fg)] outline-none placeholder:text-[color:var(--color-fg-faint)] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !url.trim()}
          aria-label="검증 시작"
          className="bg-brand-fg grid size-8 shrink-0 place-items-center rounded-full text-white transition-opacity hover:opacity-90 disabled:opacity-40"
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
        <p
          id="hero-url-error"
          role="alert"
          className="mt-2.5 max-w-[440px] text-xs text-[color:var(--color-missing)]"
        >
          {error}
        </p>
      ) : null}

      {hideCategories ? null : (
        <>
          <p className="text-fg-dim mt-3 text-xs">
            다나와 상품 페이지 URL을 붙여넣으세요
          </p>
          {/* 테두리 pill 대신 해시태그. 누를 수 없는 안내에 버튼 모양을
              씌우면 가짜 어포던스이기도 하다. */}
          <p
            className="text-fg-dim mt-2 text-xs"
            aria-label="분석이 많은 분야"
          >
            {CATEGORIES.map((c) => `#${c}`).join("  ")}
          </p>
        </>
      )}
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
