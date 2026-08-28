"use client";

import { FolderPlus, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetchHistory, isSessionExpired } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import type { AuthUser, HistoryItem } from "@/types/auth";

/**
 * 왼쪽 기둥 — 새 분석 · 폴더 · 기록.
 *
 * 목록은 `/api/history` 하나에서만 온다. 대시보드가 쓰던 것과 같은
 * 엔드포인트다 — 목록을 두 벌 만들면 한쪽이 반드시 뒤처진다.
 *
 * 폴더는 아직 백엔드가 없다. 있지도 않은 기능을 눌리는 것처럼 그려 두면
 * 거짓말이 되므로, 자리만 잡고 준비 중임을 적는다.
 */

const RISK_COLOR = (level: string) => {
  const v = (level || "").trim();
  if (v.includes("매우 낮") || v === "낮음") return "var(--color-verified)";
  if (v.includes("보통")) return "var(--color-partial)";
  if (v.includes("높")) return "var(--color-missing)";
  return "var(--color-fg-faint)";
};

const LABEL =
  "font-mono text-xs tracking-[var(--tracking-label)] text-fg-faint";

export function AppSidebar({
  user,
  onNavigate,
}: {
  user: AuthUser;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    apiFetchHistory(user.token)
      .then((h) => alive && setItems(h))
      .catch((e) => {
        if (!alive) return;
        if (isSessionExpired(e)) {
          router.replace("/login");
          return;
        }
        setFailed(true);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [user.token, router]);

  return (
    <div className="bg-surface border-border flex h-full flex-col border-r">
      {/* 머리 */}
      <div className="flex h-12 shrink-0 items-center px-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="fides-wordmark text-fg text-[15px] uppercase"
        >
          Fides
        </Link>
      </div>

      {/* 새 분석 */}
      <div className="px-3 pb-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="border-border text-fg hover:bg-bg flex items-center gap-2 rounded-[var(--radius-input)] border px-3 py-2 text-sm tracking-[var(--tracking-tight)] transition-colors"
        >
          <Plus size={15} aria-hidden />
          새 분석
        </Link>
      </div>

      {/* 폴더 — 2단계 */}
      <div className="px-4 pt-2 pb-1">
        <p className={LABEL}>폴더</p>
        <p className="text-fg-faint mt-2 flex items-center gap-1.5 text-xs">
          <FolderPlus size={13} aria-hidden />
          준비 중
        </p>
      </div>

      {/* 기록 */}
      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <p className={cn(LABEL, "shrink-0 px-4 pb-2")}>기록</p>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {loading ? (
            <ul className="space-y-1 px-2" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <li
                  key={i}
                  className="bg-border/60 h-8 animate-pulse rounded-[var(--radius-input)]"
                />
              ))}
            </ul>
          ) : failed ? (
            <p className="text-fg-dim px-2 text-xs leading-relaxed">
              기록을 불러오지 못했습니다.
            </p>
          ) : items.length === 0 ? (
            <p className="text-fg-dim px-2 text-xs leading-relaxed">
              아직 분석한 제품이 없습니다. 위에서 시작하세요.
            </p>
          ) : (
            <ul>
              {items.map((it) => {
                const active = pathname === `/history/${it.id}`;
                return (
                  <li key={it.id}>
                    <Link
                      href={`/history/${it.id}`}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2 rounded-[var(--radius-input)] px-2 py-2 transition-colors",
                        active ? "bg-bg" : "hover:bg-bg/60",
                      )}
                    >
                      <span
                        className="size-[5px] shrink-0 rounded-full"
                        style={{ background: RISK_COLOR(it.risk_level) }}
                        aria-hidden
                      />
                      <span className="text-fg min-w-0 flex-1 truncate text-[13px] tracking-[var(--tracking-tight)]">
                        {it.product_name || "이름 없음"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* 발 */}
      <div className="border-border shrink-0 border-t px-4 py-3">
        <p className="text-fg truncate text-xs">{user.nickname}</p>
        <div className="mt-1.5 flex items-center gap-3">
          <Link
            href="/about"
            onClick={onNavigate}
            className="text-fg-dim hover:text-fg text-xs transition-colors"
          >
            서비스 소개
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="text-fg-dim hover:text-fg text-xs transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
