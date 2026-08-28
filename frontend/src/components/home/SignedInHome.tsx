"use client";

import { AppShell } from "@/components/app/AppShell";
import { HeroSearch } from "@/components/landing/HeroSearch";
import type { AuthUser } from "@/types/auth";

/**
 * 로그인한 사람의 첫 화면 — 사이드바 + 검색창.
 *
 * 도구를 쓰러 온 사람에게 세일즈 페이지를 통과시키지 않는다. 소개는
 * /about 에 그대로 있고 사이드바 아래에서 언제든 갈 수 있다.
 *
 * 최근 분석 목록을 여기서 걷어냈다. 이제 사이드바가 전체 기록을 늘 옆에
 * 세워 두므로, 본문에 넷만 다시 늘어놓으면 같은 목록이 한 화면에 두 벌이
 * 된다. 본문은 지금 하는 일 하나만 맡는다.
 */
export function SignedInHome({ user }: { user: AuthUser }) {
  return (
    <AppShell user={user}>
      <div className="flex flex-1 flex-col items-center justify-center px-5 pb-24 md:px-10">
        <div className="w-full max-w-[560px] text-center">
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
      </div>
    </AppShell>
  );
}
