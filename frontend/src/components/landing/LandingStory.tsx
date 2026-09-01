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
 * 서사 7단, 화면 8칸.
 *
 * 두 곳에서 쓴다:
 *   `/`      로그인하지 않은 사람이 처음 보는 화면
 *   /about   언제든 다시 볼 수 있는 소개 화면
 *
 * 같은 서사를 두 벌 만들지 않으려고 컴포넌트로 뺐다. 다른 것은 마지막
 * 칸뿐이다 — 로그인 전에는 검색창을 놓아도 누르는 순간 로그인으로
 * 튕기므로 `시작하기` 로 바꾼다.
 *
 * 서사 순서로 읽힌다:
 *   실물을 들이대고(문제) → 해법을 꺼내고(3단계)
 *   → 어떻게 보이는지 증명하고(대조 뷰) → 근거를 밝히고
 *   → 기존과 무엇이 다른지 대조하고 → 전환으로 닫는다.
 *
 * `근거` 만 두 화면을 쓴다. 배경색 매핑은 globals.css 의
 * `fides-page-tone-landing` 에 있고 화면 수와 물려 있다.
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

export function LandingStory({ signedIn }: { signedIn?: boolean }) {
  return (
    <>
      <PageBackdrop />
      <SnapScroll tone="landing" />
      <SectionNav items={SECTIONS} />
      <FloatingActions />

      <HeroSection />
      <ProblemSection />
      <ApproachSection />
      <LedgerSection />
      <EvidenceSection />
      <DifferenceSection />
      <StartSection signedIn={signedIn} />
    </>
  );
}
