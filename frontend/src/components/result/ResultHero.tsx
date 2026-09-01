import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createElement } from "react";

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
  const isMock = data.meta.backend === "mock";

  /* 백엔드가 잰 값을 우선한다. 브라우저 타이머(elapsedSeconds)는 사용자가
     화면을 보고 있던 시간이라 새로고침하면 0 이 되고, 분석이 실제로 걸린
     시간과도 다르다. 백엔드 값이 없을 때만 대신 쓴다. */
  const duration =
    data.product.analysis_duration_seconds > 0
      ? data.product.analysis_duration_seconds
      : (elapsedSeconds ?? 0);

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
        {/* 파이프라인 버전과 분석 ID 는 사이드바(분석 메타데이터)에만 둔다.
            여기 또 적으면 같은 값이 한 화면에 두 번 나온다. mock 배지는
            메타데이터가 아니라 경고라 남긴다. */}
        {isMock ? (
          <Badge
            intent="warn"
            title="이 결과는 mock 어댑터가 생성한 합성 데이터입니다."
          >
            <span className="font-mono text-[13px] tracking-tight uppercase">
              mock data
            </span>
          </Badge>
        ) : null}
      </div>

      {/* Product + Score */}
      <div className="flex flex-col gap-6 px-5 py-6 md:flex-row md:items-start md:justify-between md:gap-8 md:px-7 md:py-8">
        <div className="flex min-w-0 items-start gap-4">
          <span
            className="grid size-14 shrink-0 place-items-center rounded-[var(--radius-icon)] text-white"
            style={{ background: "var(--gradient-cta)" }}
            aria-hidden
          >
            {/* 컴포넌트를 렌더 중에 변수로 만들지 않는다. 그렇게 하면 매
                렌더마다 새 타입이 되어 상태가 초기화될 수 있다. */}
            {createElement(iconForName(data.product.icon), { size: 26 })}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-fg text-2xl font-medium tracking-[var(--tracking-heading)] md:text-[27px]">
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
        <Meta label="분석 소요" value={`${duration.toFixed(1)}s`} mono />
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
