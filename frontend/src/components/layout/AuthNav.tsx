"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth";

const navLinkCls =
  "text-fg-muted hover:text-fg text-sm transition-colors cursor-pointer";

/**
 * Client-side auth controls injected into SiteHeader.
 * Renders nothing until mounted to prevent hydration mismatch.
 */
export function AuthNav() {
  const { user, mounted, logout } = useAuth();
  const router = useRouter();

  // placeholder to prevent layout shift before mount
  if (!mounted) {
    return <div className="h-4 w-12 animate-pulse rounded bg-surface" />;
  }

  if (user) {
    return (
      <button
        onClick={() => { logout(); router.refresh(); }}
        className={navLinkCls}
      >
        로그아웃
      </button>
    );
  }

  return (
    <Link href="/login" className={navLinkCls}>
      로그인
    </Link>
  );
}
