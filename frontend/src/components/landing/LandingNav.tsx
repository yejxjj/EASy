"use client";

import Link from "next/link";

import { FidesMark } from "@/components/brand/FidesMark";
import { useAuth } from "@/lib/auth";

const MENU = [
  { label: "서비스 소개", href: "#channels" },
  { label: "검증 방식", href: "#ledger" },
  { label: "데이터 소스", href: "#product" },
  { label: "분석 사례", href: "#cases" },
  { label: "문서", href: "#start" },
] as const;

/**
 * 랜딩 상단 네비게이션.
 *
 * 히어로 섹션 안에 absolute 로 얹는다. fixed 로 띄우면 흰 글씨가 아래쪽
 * 라이트 섹션 위에서 보이지 않게 된다 — 섹션마다 배경이 뒤집히는
 * 디자인에서는 상단 고정 네비가 성립하지 않는다.
 */
export function LandingNav() {
  // 프로젝트 공용 훅. 로그인·로그아웃 시 같은 탭의 모든 인스턴스가 동기화된다.
  const { user, mounted } = useAuth();
  const loggedIn = mounted && !!user;

  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <nav className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-6 px-5 py-4 md:px-10">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-[15px] font-medium tracking-[var(--tracking-tight)] text-white"
        >
          Fides
          <FidesMark size={24} />
        </Link>

        <ul className="hidden items-center gap-5 lg:flex">
          {MENU.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="text-xs text-white/85 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-3.5 text-xs text-white/80">
          <Link
            href={loggedIn ? "/dashboard" : "/login"}
            className="transition-colors hover:text-white"
          >
            {loggedIn ? "대시보드" : "로그인"}
          </Link>
          <span aria-hidden className="text-white/45">
            KR
          </span>
        </div>
      </nav>
    </header>
  );
}
