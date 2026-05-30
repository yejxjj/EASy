import Link from "next/link";

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
          <ul className="text-fg-muted hidden items-center gap-6 sm:flex">
            <li>
              <Link href="/" className="hover:text-fg transition-colors">
                분석
              </Link>
            </li>
            <li>
              <a
                href={`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/docs`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-fg transition-colors"
              >
                API
              </a>
            </li>
          </ul>
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
