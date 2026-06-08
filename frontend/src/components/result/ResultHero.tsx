import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/primitives/Badge";
import { Card } from "@/components/primitives/Card";
import { Tag } from "@/components/primitives/Tag";
import { ScoreGauge } from "@/components/result/ScoreGauge";
import { iconForName } from "@/lib/icons";
import type { AnalysisResult } from "@/types/analysis";

interface ResultHeroProps {
  data: AnalysisResult;
  elapsedSeconds?: number;
}

export function ResultHero({ data, elapsedSeconds }: ResultHeroProps) {
  const Icon = iconForName(data.product.icon);
  const isMock = data.meta.backend === "mock";

  return (
    <Card>
      {/* Toolbar: back link + meta badges */}
      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
        <Link
          href="/"
          className="text-fg-muted hover:text-fg inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={14} aria-hidden />
          <span>새 분석</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {isMock ? (
            <Badge intent="warn" title="이 결과는 mock 어댑터가 생성한 합성 데이터입니다.">
              <span className="font-mono text-[13px] uppercase tracking-tight">
                mock data
              </span>
            </Badge>
          ) : null}
          <Badge intent="neutral">
            <span className="font-mono text-[13px] uppercase tracking-tight">
              {data.meta.pipeline_version}
            </span>
          </Badge>
          <span className="text-fg-dim font-mono text-[13px] tracking-tight">
            #{data.analysis_id.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* Product + Score */}
      <div className="flex flex-col gap-6 px-5 py-6 md:flex-row md:items-start md:justify-between md:gap-8 md:px-7 md:py-8">
        <div className="flex min-w-0 items-start gap-4">
          <span
            className="grid size-14 shrink-0 place-items-center rounded-[var(--radius-icon)] text-white"
            style={{ background: "var(--gradient-cta)" }}
            aria-hidden
          >
            <Icon size={26} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-fg text-2xl font-extrabold tracking-tight md:text-3xl">
              {data.product.name}
            </h1>
            <p className="text-fg-subtle mt-1.5 text-sm">
              {data.product.manufacturer} · {data.product.source} ·{" "}
              {data.product.category}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {data.product.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          </div>
        </div>
        <div className="shrink-0">
          <ScoreGauge
            value={data.scores.overall}
            label={data.scores.overall_label}
          />
        </div>
      </div>

      {/* Bottom 3-col meta */}
      <div className="border-border grid grid-cols-1 divide-y border-t sm:grid-cols-3 sm:divide-x sm:divide-y-0 divide-[color:var(--color-border)]">
        <Meta label="탐지 주장 수" value={`${data.product.ai_claims_count}건`} />
        <Meta
          label="분석 소요"
          value={elapsedSeconds != null ? `${elapsedSeconds}s` : `${data.product.analysis_duration_seconds.toFixed(1)}s`}
          mono
        />
        <Meta label="분석일" value={data.product.analysis_date} mono />
      </div>
    </Card>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-3 sm:px-6">
      <span className="text-fg-subtle text-[13px] font-medium uppercase tracking-[0.08em]">{label}</span>
      <span className={`text-fg text-[13px] font-semibold ${mono ? "font-mono tabular-nums" : ""}`}>
        {value}
      </span>
    </div>
  );
}
