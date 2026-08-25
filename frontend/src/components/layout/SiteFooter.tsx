/**
 * 앱 화면(랜딩 제외)의 공통 푸터.
 *
 * 인라인 스타일에 자체 팔레트(`#f4f6fb`)와 `'Inter'` · `'JetBrains Mono'` 를
 * 직접 박아 두고 있었다. 대시보드와 분석 화면을 디자인 시스템으로 옮긴 뒤에도
 * 이 줄만 다른 활자로 남아 있어 같이 정리한다.
 *
 * 연도는 하드코딩하지 않는다. `2025` 로 굳어 있었다.
 */
export function SiteFooter() {
  const apiMode = process.env.NEXT_PUBLIC_API_MODE;

  return (
    <footer className="border-border bg-bg mt-auto border-t">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 py-5 md:px-10">
        <span className="fides-wordmark text-fg-faint text-sm uppercase">
          Fides
        </span>
        <span className="text-fg-faint font-mono text-xs tracking-[0.06em]">
          AI Reliability Analysis · {new Date().getFullYear()}
          {apiMode === "mock" ? " · mock backend" : ""}
        </span>
      </div>
    </footer>
  );
}
