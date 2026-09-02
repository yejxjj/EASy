import Link from "next/link";

import { AuthNav } from "@/components/layout/AuthNav";
import { Button } from "@/components/primitives/Button";

/**
 * 앱 화면(랜딩 제외)의 공통 헤더.
 *
 * 인라인 스타일에 자체 팔레트와 `'Inter'` 를 박아 두고, 호버 색은
 * onMouseEnter/Leave 로 직접 갈아 끼우고 있었다. 대시보드와 분석 화면을
 * 디자인 시스템으로 옮긴 뒤에도 이 줄만 다른 활자로 남아 있어 같이 정리한다.
 *
 * 호버는 CSS 로 되돌린다 — JS 이벤트로 색을 바꾸면 키보드 포커스에서는
 * 아무 반응이 없다.
 */
export function SiteHeader() {
  return (
    <header className="border-border bg-bg/90 sticky top-0 z-30 h-14 border-b backdrop-blur-md">
      <div className="mx-auto flex h-full w-full max-w-[1200px] items-center justify-between gap-4 px-5 md:px-10">
        <Link href="/" className="flex items-baseline gap-2.5">
          <span className="fides-wordmark text-fg text-[15px] uppercase">
            Fides
          </span>
          <span className="text-fg-faint hidden text-xs tracking-[var(--tracking-label)] uppercase sm:inline">
            AI Analysis
          </span>
        </Link>

        <nav className="flex items-center gap-5">
          <Link
            href="/dashboard"
            className="text-fg-dim hover:text-fg text-sm transition-colors"
          >
            대시보드
          </Link>

          <AuthNav />

          <Button asChild variant="secondary" size="sm">
            <Link href="/">분석 시작</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
