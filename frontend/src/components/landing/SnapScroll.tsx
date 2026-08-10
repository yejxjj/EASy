"use client";

import { useEffect } from "react";

/**
 * 랜딩에서만 섹션 스냅을 켠다.
 *
 * 스냅 규칙 자체는 globals.css 에 있고 (`html.fides-snap`), 여기서는
 * 클래스만 붙였다 뗀다. 다른 라우트로 이동하면 반드시 풀려야 하므로
 * cleanup 이 핵심이다 — 대시보드에서 스냅이 켜져 있으면 표가 잘린다.
 */
export function SnapScroll() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("fides-snap");
    return () => root.classList.remove("fides-snap");
  }, []);

  return null;
}
