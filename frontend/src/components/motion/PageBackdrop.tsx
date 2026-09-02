/**
 * 페이지 전체에 깔리는 배경 레이어.
 *
 * 화면에 고정되어 있고 색은 스크롤 진행률을 따라간다
 * (globals.css 의 `--page-bg` / `fides-page-tone`).
 * 섹션들이 각자 배경을 칠하는 대신 이 레이어 위에 투명하게 얹히므로
 * 섹션 경계에서 색이 끊기지 않는다.
 *
 * DOM 상 첫 요소여야 한다 — 뒤따르는 섹션들이 그 위에 그려진다.
 */
export function PageBackdrop() {
  return <div aria-hidden className="page-backdrop" />;
}
