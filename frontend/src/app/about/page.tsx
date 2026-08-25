import { LandingStory } from "@/components/landing/LandingStory";

/**
 * 소개 — 서사를 언제든 다시 보는 자리.
 *
 * `/` 는 로그인하면 검색창으로 바뀌므로, 그 뒤에도 "무엇을 근거로 어떻게
 * 판단하는가"를 볼 수 있어야 한다. 같은 서사를 두 벌 만들지 않으려고
 * LandingStory 하나를 둘이 나눠 쓴다.
 *
 * 여기서는 이미 로그인한 사람도 보므로 마지막 칸에 검색창을 둔다 —
 * 읽다가 바로 분석을 시작할 수 있는 편이 낫다.
 */

export const metadata = {
  title: "Fides — 무엇을 근거로 판단하는가",
  description:
    "AI 워싱을 가려내는 방법. 상품이 내세운 AI 주장을 문장 단위로 뜯어내고 특허·인증·공시 등 9개 공공 기록과 대조합니다.",
};

export default function AboutPage() {
  return <LandingStory signedIn />;
}
