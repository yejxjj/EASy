import { SectionNav } from "@/components/landing/SectionNav";
import { SnapScroll } from "@/components/landing/SnapScroll";
import {
  ApproachSection,
  DifferenceSection,
  EvidenceSection,
  HeroSection,
  LedgerSection,
  ProblemSection,
  StartSection,
} from "@/components/landing/sections";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { PageBackdrop } from "@/components/motion/PageBackdrop";

/**
 * 랜딩 — 7칸.
 *
 * 서사 순서로 읽힌다:
 *   실물을 들이대고(문제·규모) → 해법을 꺼내고(3단계)
 *   → 어떻게 보이는지 증명하고(대조 뷰) → 근거를 밝히고
 *   → 기존과 무엇이 다른지 대조하고 → 전환으로 닫는다.
 *
 * 화면 수를 줄이며 덜어낸 것:
 *   · `실태` → `문제` 흡수. 광고 문구와 글로벌 통계는 같은 주장의 앞뒤다.
 *   · `검증 채널` + `근거 소스` → `근거` 통합. 채널 카드에 이미 소스
 *     이름이 적혀 있어 다음 화면에서 같은 목록을 다시 읽게 됐다.
 *   · `제품과 리포트` 삭제. 기능 목록은 서사에 기여하지 않고 목록은
 *     푸터에 남아 있다.
 *   · `분석 사례` 삭제. 지금은 예시 데이터라 설득력이 약하다.
 *     실제 분석 결과가 쌓이면 되살릴 가치가 큰 화면이다.
 *
 * 섹션 본문은 components/landing/sections.tsx 에 한 벌만 있다.
 * 더 줄인 6칸안은 /preview/6 에서 볼 수 있다.
 */

const SECTIONS = [
  { id: "hero", label: "소개", dark: true },
  { id: "problem", label: "AI 워싱", dark: true },
  { id: "approach", label: "해결 방식" },
  { id: "ledger", label: "대조 뷰" },
  { id: "evidence", label: "근거", dark: true },
  { id: "difference", label: "차별성" },
  { id: "start", label: "시작하기" },
];

export default function LandingPage() {
  return (
    <>
      <PageBackdrop />
      <SnapScroll sections={7} />
      <SectionNav items={SECTIONS} />
      <FloatingActions />

      <HeroSection />
      <ProblemSection withStats />
      <ApproachSection />
      <LedgerSection />
      <EvidenceSection />
      <DifferenceSection />
      <StartSection />
    </>
  );
}
