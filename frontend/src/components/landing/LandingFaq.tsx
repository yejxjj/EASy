import { Card } from "@/components/primitives/Card";
import { SectionHeader } from "@/components/primitives/SectionHeader";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "어떤 사이트를 지원하나요?",
    a: "현재는 다나와 상품 페이지(prod·www·m.danawa.com)만 지원합니다. 다른 커머스 도메인은 분석 요청 시 400 응답과 함께 명확히 거절됩니다.",
  },
  {
    q: "AI 워싱 위험도 점수는 어떻게 산정되나요?",
    a: "텍스트 신뢰도(주장 구체성), 검증 신뢰도(공공 인증 커버리지), 관계형 신뢰도(특허·기술 보유 근거) 세 차원을 결합한 0–100 종합 점수입니다. 낮을수록 위험이 낮습니다.",
  },
  {
    q: "공공 데이터 소스는 무엇이 사용되나요?",
    a: "전파인증(RRA), 조달청 AI 우수제품, TIPA AI 검증, KORAIA 회원사, KIPRIS 특허, GS·NEP 신제품 인증 등 7개 이상의 공공 데이터를 교차 검증합니다.",
  },
  {
    q: "현재 결과는 실제 모델이 산정한 결과인가요?",
    a: "아니요. 현재는 모델 연결 전 mock 어댑터의 합성 결과입니다. 모든 응답의 `meta.backend = mock`과 HTTP 헤더 `X-Analyzer-Backend: mock`으로 명시되어 있습니다. 모델 연결은 backend/app/models/real/ 디렉토리만 손대면 됩니다.",
  },
  {
    q: "결과를 어떻게 활용해야 하나요?",
    a: "본 점수는 구매 결정의 보조 지표이며, 최종 판단은 사용자 책임입니다. XAI 근거와 인증·등록 현황을 함께 검토해 주세요.",
  },
];

export function LandingFaq() {
  return (
    <section aria-label="자주 묻는 질문" className="mx-auto max-w-7xl px-6">
      <Card>
        <SectionHeader
          eyebrow="faq"
          title="자주 묻는 질문"
          aside={<span>업데이트: 2026-05</span>}
        />
        <dl className="divide-soft px-5 py-2">
          {FAQS.map((f) => (
            <div key={f.q} className="py-4">
              <dt className="text-fg text-sm font-semibold tracking-tight">
                Q. {f.q}
              </dt>
              <dd className="text-fg-muted mt-1.5 text-sm leading-relaxed">
                {f.a}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
    </section>
  );
}
