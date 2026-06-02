import Link from "next/link";

import { AuthNav } from "@/components/layout/AuthNav";
import { Button } from "@/components/primitives/Button";

export function SiteHeader() {
  return (
    <header className="border-border bg-bg/85 sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="Fides home"
        >
          <span className="fides-wordmark text-xl font-extrabold tracking-tight">
            Fides
          </span>
          <span
            className="text-fg-subtle hidden text-[11px] font-medium tracking-tight sm:inline"
            style={{ position: "relative", top: 1 }}
          >
            AI Washing Detection
          </span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-6 text-sm">
          {/* 로그인 / 로그아웃 (client island) */}
          <AuthNav />

          {/* 대시보드 */}
          <Link
            href="/dashboard"
            className="text-fg-muted hover:text-fg hidden transition-colors sm:block"
          >
            대시보드
          </Link>

          {/* 분석 시작 CTA */}
          <Button asChild variant="cta" size="sm" className="hidden md:inline-flex">
            <Link href="/#analyze">
              분석 시작
              <span aria-hidden>→</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
