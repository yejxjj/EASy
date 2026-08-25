"use client";

import { useEffect } from "react";

/**
 * 랜딩에서만 섹션 스냅과 배경 색 흐름을 켠다.
 *
 * 규칙 자체는 globals.css 에 있고 (`html.fides-snap`), 여기서는 클래스만
 * 붙였다 뗀다. 다른 라우트로 이동하면 반드시 풀려야 하므로 cleanup 이
 * 핵심이다 — 대시보드에서 스냅이 켜져 있으면 표가 잘린다.
 *
 * `tone` 은 배경색이 바뀌는 지점을 고르는 데 쓴다. 잉크 구간이 오는 스크롤
 * 비율은 그 라우트의 화면 배열에 따라 달라지기 때문이다.
 *
 * 예전에는 화면 수(6·7·8·9)로 골랐는데, 섹션 하나의 높이가 바뀔 때마다
 * 숫자를 다시 세야 했고 두 라우트가 우연히 같은 숫자가 되면 서로 다른
 * 배열인데 같은 키프레임을 쓰게 됐다. 배열마다 이름을 붙이는 편이 안전하다.
 * 각 이름의 실제 매핑은 globals.css 에 적혀 있다.
 */
export type ToneMap = "landing" | "preview6";

export function SnapScroll({ tone }: { tone: ToneMap }) {
  useEffect(() => {
    const root = document.documentElement;
    const toneClass = `tone-${tone}`;

    root.classList.add("fides-snap", toneClass);
    return () => root.classList.remove("fides-snap", toneClass);
  }, [tone]);

  return null;
}
