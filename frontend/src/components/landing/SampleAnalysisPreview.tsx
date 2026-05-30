"use client";

import { ArrowUpRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/primitives/Badge";
import { Button } from "@/components/primitives/Button";
import { Card, CardBody } from "@/components/primitives/Card";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Tag } from "@/components/primitives/Tag";
import { startAnalysis } from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import { iconForName } from "@/lib/icons";
import { scoreTier, tierStyles, type ScoreTier } from "@/lib/score";

/**
 * Three pre-configured sample analyses backed by `MockAnalyzer` scenarios.
 * Clicking the CTA submits the predetermined Danawa URL — the backend's
 * URL-to-scenario picker (`backend/app/models/mock/seeds.py`) will map each
 * URL to the matching scenario.
 *
 * The "샘플 결과" label is shown prominently so users can tell these are
 * scripted demos, not real analyses.
 */

interface SampleScenario {
  key: string;
  url: string;
  productName: string;
  manufacturer: string;
  category: string;
  iconName: string;
  tags: string[];
  overallScore: number;
  overallLabel: "양호 구간" | "주의 구간" | "위험 구간";
}

const SAMPLES: SampleScenario[] = [
  {
    key: "samsung",
    url: "https://prod.danawa.com/info/?pcode=samsung-bespoke-ai-fridge",
    productName: "삼성 비스포크 AI 냉장고",
    manufacturer: "삼성전자",
    category: "생활가전 / 냉장고",
    iconName: "Refrigerator",
    tags: ["비스포크", "AI 비전", "한국 브랜드"],
    overallScore: 25,
    overallLabel: "양호 구간",
  },
  {
    key: "xiaomi",
    url: "https://prod.danawa.com/info/?pcode=xiaomi-air-purifier-4-pro",
    productName: "샤오미 공기청정기 4 Pro",
    manufacturer: "Xiaomi",
    category: "생활가전 / 공기청정기",
    iconName: "Wind",
    tags: ["IoT 가전", "중국 브랜드", "AI 기능 주장"],
    overallScore: 60,
    overallLabel: "주의 구간",
  },
  {
    key: "no-brand",
    url: "https://prod.danawa.com/info/?pcode=no-brand-massage-gun-sample",
    productName: "스마트 AI 마사지건 PRO",
    manufacturer: "(브랜드 미상)",
    category: "생활가전 / 마사지기",
    iconName: "Activity",
    tags: ["무명 브랜드", "AI 자동조절"],
    overallScore: 85,
    overallLabel: "위험 구간",
  },
];

const TIER_TEXT: Record<ScoreTier, string> = {
  ok: "양호 — 인증·특허 충분",
  warn: "주의 — 인증 일부 누락",
  danger: "위험 — 검증 근거 부족",
};

export function SampleAnalysisPreview() {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onRun = async (sample: SampleScenario) => {
    setError(null);
    setBusyKey(sample.key);
    try {
      const { analysis_id } = await startAnalysis(sample.url);
      router.push(`/analysis/${analysis_id}`);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "백엔드에 연결할 수 없습니다. uvicorn 서버를 확인해 주세요.",
      );
      setBusyKey(null);
    }
  };

  return (
    <section
      aria-label="샘플 분석"
      className="mx-auto max-w-7xl px-6"
    >
      <Card>
        <SectionHeader
          eyebrow="samples"
          title="샘플 분석 결과"
          aside={
            <span>
              실제 모델 연결 전 — 시나리오 3종은 결정적 mock 데이터입니다.
            </span>
          }
        />
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {SAMPLES.map((s) => {
            const Icon = iconForName(s.iconName);
            const tier = scoreTier(s.overallScore);
            const styles = tierStyles[tier];
            return (
              <article
                key={s.key}
                className="border-border bg-bg group flex flex-col gap-4 rounded-[var(--radius-card)] border p-5 transition-shadow hover:shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-xl text-white"
                    style={{ background: "var(--gradient-cta)" }}
                    aria-hidden
                  >
                    <Icon size={20} />
                  </span>
                  <Badge intent="warn">
                    <span className="font-mono text-[10px] uppercase tracking-tight">
                      sample
                    </span>
                  </Badge>
                </div>
                <div>
                  <h3 className="text-fg text-sm font-bold tracking-tight">
                    {s.productName}
                  </h3>
                  <p className="text-fg-subtle mt-1 text-xs">
                    {s.manufacturer} · {s.category}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
                <div className="border-border flex items-end justify-between gap-2 border-t pt-3">
                  <div>
                    <p className="mono-eyebrow">overall</p>
                    <p
                      className={`${styles.text} text-3xl font-extrabold tracking-tight tabular-nums`}
                    >
                      {s.overallScore}
                      <span className="text-fg-subtle ml-1 text-xs font-medium">
                        /100
                      </span>
                    </p>
                    <p className={`${styles.text} mt-0.5 text-[11px] font-semibold`}>
                      {TIER_TEXT[tier]}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busyKey !== null}
                    onClick={() => onRun(s)}
                    aria-label={`${s.productName} 샘플 분석 시작`}
                  >
                    {busyKey === s.key ? (
                      <Loader2 size={14} className="animate-spin" aria-hidden />
                    ) : (
                      <ArrowUpRight size={14} aria-hidden />
                    )}
                    {busyKey === s.key ? "이동 중" : "분석 보기"}
                  </Button>
                </div>
              </article>
            );
          })}
        </CardBody>
        {error ? (
          <p className="text-danger px-5 pb-5 text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </Card>
    </section>
  );
}
