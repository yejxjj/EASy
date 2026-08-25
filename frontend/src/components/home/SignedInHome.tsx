"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { HeroSearch } from "@/components/landing/HeroSearch";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { apiFetchHistory } from "@/lib/api/auth";
import type { AuthUser, HistoryItem } from "@/types/auth";

/**
 * 로그인한 사람의 첫 화면 — 검색창 + 최근 분석 (변형 C).
 *
 * 도구를 쓰러 온 사람에게 세일즈 페이지를 통과시키지 않는다. 소개는
 * /about 에 그대로 있고 헤더에서 언제든 갈 수 있다.
 *
 * 헤더·푸터를 이 컴포넌트가 직접 그린다. ConditionalShell 은 경로만 보고
 * 셸을 붙이는데, `/` 는 로그인 여부에 따라 셸이 필요할 때와 아닐 때가
 * 갈리기 때문이다(로그아웃 화면은 자체 내비를 갖고 있다).
 *
 * 최근 분석은 대시보드와 같은 `apiFetchHistory` 를 쓴다. 실패해도 화면의
 * 주인공인 검색창은 그대로 서 있어야 하므로 목록만 조용히 접는다.
 */

const RISK_COLOR = (level: string) => {
  const v = (level || "").trim();
  if (v.includes("매우 낮") || v === "낮음") return "var(--color-verified)";
  if (v.includes("보통")) return "var(--color-partial)";
  if (v.includes("높")) return "var(--color-missing)";
  return "var(--color-fg-faint)";
};

export function SignedInHome({ user }: { user: AuthUser }) {
  const [recent, setRecent] = useState<HistoryItem[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    apiFetchHistory(user.token)
      .then((h) => {
        if (alive) setRecent(h.slice(0, 4));
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [user.token]);

  return (
    <>
      <SiteHeader />
      <main className="bg-bg flex flex-1 flex-col items-center justify-center px-5 py-16 md:px-10">
        <div className="w-full max-w-[560px]">
          <div className="text-center">
            <h1 className="text-fg text-[19px] font-medium tracking-[var(--tracking-heading)]">
              무엇을 검증할까요
            </h1>
            <p className="text-fg-dim mt-2.5 text-xs leading-loose">
              다나와 상품 페이지 URL을 넣으면 AI 문구를 문장 단위로 뜯어내고
              공공 기록과 대조합니다.
            </p>

            <HeroSearch
              hideCategories
              tone="light"
              className="mt-7 flex flex-col items-center"
            />
          </div>

          {recent.length > 0 ? (
            <div className="mt-14">
              <div className="flex items-baseline justify-between">
                <p className="text-fg-faint font-mono text-xs tracking-[var(--tracking-label)]">
                  최근 분석
                </p>
                <Link
                  href="/dashboard"
                  className="text-fg-dim hover:text-fg text-xs transition-colors"
                >
                  전체 보기 →
                </Link>
              </div>
              <ul className="border-border divide-border mt-3.5 divide-y border-y">
                {recent.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/history/${r.id}`}
                      className="hover:bg-surface flex items-center gap-4 py-3 transition-colors"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="text-fg block truncate text-sm tracking-[var(--tracking-tight)]">
                          {r.product_name}
                        </span>
                        <span className="text-fg-dim mt-0.5 block truncate text-xs">
                          {r.company_name || "브랜드 미상"}
                        </span>
                      </span>
                      <span
                        className="tnum shrink-0 text-sm font-medium"
                        style={{ color: RISK_COLOR(r.risk_level) }}
                      >
                        {r.accs_score.toFixed(1)}
                      </span>
                      <span
                        className="hidden w-[64px] shrink-0 text-right font-mono text-xs tracking-[var(--tracking-label)] sm:block"
                        style={{ color: RISK_COLOR(r.risk_level) }}
                      >
                        {r.risk_level || "—"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* 기록이 없거나 못 불러왔을 때도 소개로 가는 길은 남긴다 */}
          {recent.length === 0 ? (
            <p className="text-fg-faint mt-12 text-center text-xs">
              {failed ? "최근 분석을 불러오지 못했습니다. " : ""}
              <Link href="/about" className="text-brand-fg underline-offset-4 hover:underline">
                어떻게 판단하나요 →
              </Link>
            </p>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
