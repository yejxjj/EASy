import { Badge } from "@/components/primitives/Badge";
import { Card } from "@/components/primitives/Card";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import type { AnalysisResult } from "@/types/analysis";

interface MetaSidebarProps {
  data: AnalysisResult;
}

function Row({
  k,
  v,
  mono = false,
}: {
  k: string;
  v: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <dt className="text-fg-subtle text-[11px] uppercase font-medium tracking-[0.08em] whitespace-nowrap">
        {k}
      </dt>
      <dd
        className={`text-fg min-w-0 truncate text-right text-xs ${mono ? "font-mono tabular-nums" : ""}`}
      >
        {v}
      </dd>
    </div>
  );
}

export function MetaSidebar({ data }: MetaSidebarProps) {
  const created = new Date(data.created_at);
  const createdStr = created.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card>
      <SectionHeader eyebrow="meta" title="분석 메타데이터" />
      <dl className="divide-soft px-5 pb-3">
        <Row k="분석 ID" v={data.analysis_id} mono />
        <Row k="파이프라인" v={data.meta.pipeline_version} mono />
        <Row
          k="백엔드"
          v={
            <Badge intent={data.meta.backend === "mock" ? "warn" : "ok"}>
              <span className="font-mono">{data.meta.backend}</span>
            </Badge>
          }
        />
        <Row k="모델 버전" v={data.meta.model_version ?? "—"} mono />
        <Row k="생성 시각" v={createdStr} />
        <Row
          k="소요 시간"
          v={`${data.product.analysis_duration_seconds.toFixed(1)}s`}
          mono
        />
        <Row k="분석일" v={data.product.analysis_date} mono />
      </dl>
    </Card>
  );
}
