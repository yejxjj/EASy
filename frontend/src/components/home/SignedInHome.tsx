"use client";

import { AppShell } from "@/components/app/AppShell";
import { HeroSearch } from "@/components/landing/HeroSearch";
import type { AuthUser } from "@/types/auth";

/**
 * 로그인한 사람의 첫 화면 — 사이드바 + 하단 입력창.
 *
 * 입력창을 화면 아래에 붙였다. AI 도구들이 다 그렇게 두는 데에는 이유가
 * 있다 — 위에는 지금까지의 결과가 쌓이고 아래는 다음 입력 자리로 고정돼
 * 있어서, 무엇이 쌓이든 손이 가는 곳은 늘 같다. 여기도 나중에 이 자리
 * 위쪽에 진행 상황과 결과가 들어올 자리다.
 *
 * 최근 분석 목록은 걷어냈다. 사이드바가 전체 기록을 늘 옆에 세워 두므로
 * 본문에 넷을 다시 늘어놓으면 같은 목록이 한 화면에 두 벌이 된다.
 */
export function SignedInHome({ user }: { user: AuthUser }) {
  return (
    <AppShell user={user}>
      <div className="flex flex-1 flex-col">
        {/* 인사 — 아직 아무것도 쌓이지 않았을 때 이 자리를 채운다 */}
        <div className="flex flex-1 items-center justify-center px-5 md:px-10">
          <div className="w-full max-w-[560px] text-center">
            <h1 className="text-fg text-[19px] font-medium tracking-[var(--tracking-heading)]">
              무엇을 검증할까요
            </h1>
            <p className="text-fg-dim mt-2.5 text-xs leading-loose">
              다나와 상품 페이지 URL을 넣으면 AI 문구를 문장 단위로 뜯어내고
              공공 기록과 대조합니다.
            </p>
          </div>
        </div>

        {/* 입력창 — 아래 고정 */}
        <div className="shrink-0 px-5 pb-6 md:px-10 md:pb-8">
          <div className="mx-auto w-full max-w-[640px]">
            <HeroSearch hideCategories tone="light" full />
            <p className="text-fg-faint mt-2.5 text-center text-[11px]">
              다나와 상품 페이지만 읽을 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
