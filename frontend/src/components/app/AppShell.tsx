"use client";

import { PanelLeft } from "lucide-react";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { AppSidebar } from "@/components/app/AppSidebar";
import type { AuthUser } from "@/types/auth";

/**
 * 로그인한 사람이 쓰는 작업 화면의 껍데기.
 *
 * 왼쪽에 기록, 가운데에 지금 하는 일. 분석은 한 번 하고 끝나는 게 아니라
 * 여러 제품을 이어서 보게 되는데, 그때마다 목록 화면으로 돌아갔다 오는
 * 왕복이 필요했다. 목록을 옆에 세워 두면 그 왕복이 없어진다.
 *
 * **이 사이드바가 대시보드의 목록 자리를 넘겨받는다.** 예전에 /history 를
 * /dashboard 로 합친 이유가 목록이 두 벌이면 한쪽이 반드시 뒤처지기
 * 때문이었고, 여기서 같은 실수를 반복할 이유가 없다.
 *
 * 접힘 상태는 이 브라우저에만 남긴다. 서버가 알 필요도 없고, 다른 기기까지
 * 따라갈 만한 값도 아니다.
 */

const COLLAPSE_KEY = "fides_sidebar_collapsed";
const COLLAPSE_EVENT = "fides-sidebar-change";
const SIDEBAR_WIDTH = 260;

/* localStorage 는 React 바깥의 저장소다. effect 안에서 setState 로 읽어 오면
   마운트마다 연쇄 렌더가 생긴다(react-hooks/set-state-in-effect).
   lib/auth.ts 가 세션에 쓰는 방식과 같다. */
function subscribeCollapsed(onChange: () => void) {
  window.addEventListener(COLLAPSE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(COLLAPSE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    /* 사생활 보호 모드 등에서는 접근 자체가 던진다. 펼친 채로 둔다. */
    return false;
  }
}

/* 서버에서는 언제나 펼친 모양. 하이드레이션이 어긋나지 않는다. */
const readCollapsedServer = () => false;

export function AppShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    readCollapsedServer,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, readCollapsed() ? "0" : "1");
    } catch {
      /* 저장을 못 하면 접기도 안 된다. 화면이 깨지진 않는다. */
    }
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  }, []);

  /* 서랍이 열려 있을 때 Esc 로 닫는다. 바깥을 누를 데가 없는 좁은 화면에서
     빠져나올 길이 하나는 있어야 한다. */
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="bg-bg flex min-h-dvh">
      {/* ── 데스크톱 사이드바 ──
          폭을 인라인으로 준다. `w-0` / `w-[260px]` 를 삼항으로 넘겼더니
          Tailwind 가 `w-0` 규칙을 만들지 않아 접어도 260px 를 계속 차지했다.
          한 값짜리 애니메이션에 스캐너를 신뢰할 이유가 없다. */}
      <div
        className="hidden shrink-0 overflow-hidden transition-[width] duration-200 md:block"
        style={{ width: collapsed ? 0 : SIDEBAR_WIDTH }}
        aria-hidden={collapsed}
        inert={collapsed ? true : undefined}
      >
        {/* 스크롤을 따라오되 자리는 위 래퍼가 잡는다 */}
        <div
          className="sticky top-0 h-dvh"
          style={{ width: SIDEBAR_WIDTH }}
        >
          <AppSidebar user={user} onNavigate={() => {}} />
        </div>
      </div>

      {/* ── 모바일 서랍 ── */}
      {drawerOpen ? (
        <>
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
          />
          <div
            className="fixed top-0 bottom-0 left-0 z-50 md:hidden"
            style={{ width: 280 }}
          >
            <AppSidebar user={user} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </>
      ) : null}

      {/* ── 본문 ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center px-3">
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
            aria-expanded={!collapsed}
            className="text-fg-faint hover:text-fg hidden rounded-[var(--radius-input)] p-2 transition-colors md:block"
          >
            <PanelLeft size={17} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="메뉴 열기"
            className="text-fg-faint hover:text-fg rounded-[var(--radius-input)] p-2 transition-colors md:hidden"
          >
            <PanelLeft size={17} aria-hidden />
          </button>
        </div>

        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
