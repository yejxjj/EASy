"use client";

import { useEffect } from "react";

/**
 * 랜딩에서만 섹션 스냅과 배경 색 흐름을 켠다.
 *
 * 규칙 자체는 globals.css 에 있고 (`html.fides-snap`), 여기서는 클래스만
 * 붙였다 뗀다. 다른 라우트로 이동하면 반드시 풀려야 하므로 cleanup 이
 * 핵심이다 — 대시보드에서 스냅이 켜져 있으면 표가 잘린다.
 *
 * `sections` 는 배경색이 바뀌는 지점을 고르는 데 쓴다. 화면 수가 다르면
 * 잉크 구간이 오는 스크롤 비율도 달라지기 때문이다.
 */
export function SnapScroll({ sections = 7 }: { sections?: 11 | 8 | 7 | 6 }) {
  useEffect(() => {
    const root = document.documentElement;
    const toneClass = sections === 11 ? null : `tone-${sections}`;

    root.classList.add("fides-snap");
    if (toneClass) root.classList.add(toneClass);

    return () => {
      root.classList.remove("fides-snap");
      if (toneClass) root.classList.remove(toneClass);
    };
  }, [sections]);

  return null;
}
