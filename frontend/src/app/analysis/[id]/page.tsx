import { AnalysisRunner } from "@/components/analysis/AnalysisRunner";
import { MaybeAppShell } from "@/components/app/MaybeAppShell";

interface AnalysisPageProps {
  params: Promise<{ id: string }>;
}

/**
 * 분석 진행 · 결과.
 *
 * 셸 안에서 그린다 — 기다리는 동안에도 사이드바가 옆에 있어야 다른 기록을
 * 열어 볼 수 있다. 분석은 몇십 초가 걸리는 일이라 그 시간 동안 화면이
 * 막혀 있을 이유가 없다.
 *
 * 비로그인 분석도 되므로 셸은 조건부다. 그때는 사이드바 없이 진행 화면만
 * 나온다.
 */
export default async function AnalysisPage({ params }: AnalysisPageProps) {
  const { id } = await params;
  return (
    <MaybeAppShell signedOutChrome="site">
      <AnalysisRunner id={id} />
    </MaybeAppShell>
  );
}
