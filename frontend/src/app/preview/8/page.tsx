import { SectionNav } from "@/components/landing/SectionNav";
import { SnapScroll } from "@/components/landing/SnapScroll";
import {
  ApproachSection,
  CasesSection,
  DifferenceSection,
  EvidenceSection,
  HeroSection,
  LedgerSection,
  ProblemSection,
  StartSection,
} from "@/components/landing/sections";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { PageBackdrop } from "@/components/motion/PageBackdrop";
import { PreviewBadge } from "@/components/landing/PreviewBadge";

/**
 * 랜딩 8칸안 — 검토용.
 *
 * 현재안(11칸)에서 셋을 덜어냈다.
 *   · `실태` → `문제` 에 흡수. "이 문장들이 팔린다"와 "글로벌 58%가
 *     부풀린 적 있다"는 같은 주장의 앞뒤라 한 화면에 들어간다.
 *     국내 통계(61%·48%)는 빠진다.
 *   · `검증 채널` + `근거 소스` → `근거` 로 통합. 둘 다 "무엇을 근거로
 *     삼는가"에 답하는데 채널 카드에 이미 소스 이름이 적혀 있었다.
 *   · `제품과 리포트` 삭제. 기능 목록은 서사에 기여하지 않고 네 항목 중
 *     대조 뷰는 바로 앞 화면에서 이미 봤다. 목록은 푸터에 남아 있다.
 */

export const metadata = { title: "Fides — 8칸안" };

const SECTIONS = [
  { id: "hero", label: "소개", dark: true },
  { id: "problem", label: "AI 워싱", dark: true },
  { id: "approach", label: "해결 방식" },
  { id: "ledger", label: "대조 뷰" },
  { id: "evidence", label: "근거", dark: true },
  { id: "difference", label: "차별성" },
  { id: "cases", label: "분석 사례" },
  { id: "start", label: "시작하기" },
];

export default function Preview8() {
  return (
    <>
      <PageBackdrop />
      <SnapScroll sections={8} />
      <SectionNav items={SECTIONS} />
      <FloatingActions />
      <PreviewBadge count={8} />

      <HeroSection />
      <ProblemSection withStats />
      <ApproachSection />
      <LedgerSection />
      <EvidenceSection />
      <DifferenceSection />
      <CasesSection />
      <StartSection />
    </>
  );
}
