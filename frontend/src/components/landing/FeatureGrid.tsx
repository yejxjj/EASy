import { FileText, Network, ShieldCheck } from "lucide-react";

import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/primitives/Card";
import type { StrapColor } from "@/components/primitives/Card";
import type { Dimension } from "@/lib/score";
import { dimensionTextClass } from "@/lib/score";

interface FeatureItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  title: string;
  description: string;
  signals: string;
  strap: StrapColor;
  dim: Dimension;
}

const FEATURES: FeatureItem[] = [
  {
    icon: FileText,
    label: "Dimension 01",
    title: "텍스트 신뢰도",
    description:
      "AI 주장의 구체성과 검증 가능성을 LLM이 분류하고 정량화합니다. 모호한 마케팅 표현일수록 점수가 높아집니다.",
    signals: "OCR · Gemini 정제 · 평균 4s",
    strap: "text",
    dim: "text",
  },
  {
    icon: ShieldCheck,
    label: "Dimension 02",
    title: "검증 신뢰도",
    description:
      "전파인증·조달청 AI 우수제품·TIPA·KORAIA 등 공공 데이터베이스와 교차 검증해 인증 미보유 항목을 확인합니다.",
    signals: "전파인증 · 조달청 · TIPA · KORAIA",
    strap: "verify",
    dim: "verify",
  },
  {
    icon: Network,
    label: "Dimension 03",
    title: "관계형 신뢰도",
    description:
      "KIPRIS 특허·GS 인증·NEP 신제품 인증을 검색해 제조사의 실제 기술 보유 근거가 있는지 평가합니다.",
    signals: "KIPRIS · GS · NEP",
    strap: "relational",
    dim: "relational",
  },
];

export function FeatureGrid() {
  return (
    <section
      aria-label="신뢰도 3축"
      className="mx-auto max-w-7xl px-6"
    >
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <p className="mono-eyebrow">three-axis trust</p>
          <h2 className="text-fg text-2xl font-bold tracking-tight md:text-3xl">
            AI 워싱을 세 가지 축으로 분해합니다
          </h2>
        </div>
        <p className="text-fg-subtle font-mono text-xs uppercase tracking-[0.12em]">
          3 axes · 6 stages
        </p>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <Card key={f.title} strapColor={f.strap}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Icon
                    size={20}
                    className={dimensionTextClass(f.dim)}
                    aria-hidden
                  />
                  <span className="text-fg-dim font-mono text-[10px] uppercase tracking-[0.12em] whitespace-nowrap">
                    {f.label}
                  </span>
                </div>
                <CardTitle>{f.title}</CardTitle>
              </CardHeader>
              <CardBody>
                <CardDescription>{f.description}</CardDescription>
                <p className="text-fg-subtle mt-4 font-mono text-[11px] tracking-tight">
                  {f.signals}
                </p>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
