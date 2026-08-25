import { PreviewBadge } from "@/components/landing/PreviewBadge";
import { SectionNav } from "@/components/landing/SectionNav";
import { SnapScroll } from "@/components/landing/SnapScroll";
import {
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
 * 랜딩 6칸안 — 검토용.
 *
 * 8칸안에서 둘을 더 덜어냈다.
 *   · `해결 방식`(3단계) 삭제. 말로 설명하는 화면인데 바로 다음
 *     `대조 뷰` 가 그 결과를 보여준다. 보여주는 쪽이 이기므로 3단계는
 *     대조 뷰 상단에 한 줄 요약으로만 남긴다.
 *   · `분석 사례` 삭제. 지금은 예시 데이터라 설득력이 약하다. 실제 분석
 *     결과가 쌓이면 되살릴 가치가 큰 화면이다.
 *
 * `차별성` 은 남겼다 — 발표와 포트폴리오에서 "기존과 뭐가 다른가"가
 * 핵심 질문이기 때문이다.
 */

export const metadata = { title: "Fides — 6칸안" };

const SECTIONS = [
  { id: "hero", label: "소개", dark: true },
  { id: "problem", label: "AI 워싱", dark: true },
  { id: "ledger", label: "대조 뷰" },
  { id: "evidence", label: "근거", dark: true },
  { id: "difference", label: "차별성" },
  { id: "start", label: "시작하기" },
];

export default function Preview6() {
  return (
    <>
      <PageBackdrop />
      <SnapScroll tone="preview6" />
      <SectionNav items={SECTIONS} />
      <FloatingActions />
      <PreviewBadge count={6} />

      <HeroSection nextId="problem" />
      <ProblemSection />
      <LedgerSection withSteps />
      <EvidenceSection />
      <DifferenceSection />
      <StartSection />
    </>
  );
}
