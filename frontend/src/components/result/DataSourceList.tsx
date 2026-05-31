import { Card } from "@/components/primitives/Card";
import { SectionHeader } from "@/components/primitives/SectionHeader";

interface DataSource {
  label: string;
  category: "verify" | "relational" | "claims";
  desc: string;
}

const SOURCES: DataSource[] = [
  { label: "전파인증 (RRA)", category: "verify", desc: "필수 인증" },
  { label: "조달청 AI 우수제품", category: "verify", desc: "AI 인증" },
  { label: "TIPA AI 검증", category: "verify", desc: "AI 인증" },
  { label: "KORAIA 회원사", category: "verify", desc: "협회 등록" },
  { label: "KIPRIS 특허", category: "relational", desc: "기술 보유" },
  { label: "GS 인증 (TTA)", category: "relational", desc: "품질 인증" },
  { label: "NEP 신제품", category: "relational", desc: "신기술 인증" },
];

const CATEGORY_DOT: Record<DataSource["category"], string> = {
  verify: "bg-[color:var(--color-dim-verify)]",
  relational: "bg-[color:var(--color-dim-relational)]",
  claims: "bg-[color:var(--color-dim-text)]",
};

export function DataSourceList() {
  return (
    <Card>
      <SectionHeader
        eyebrow="data sources"
        title="공공 데이터 소스"
        count={SOURCES.length}
      />
      <ul className="divide-soft px-5 pb-3">
        {SOURCES.map((s) => (
          <li key={s.label} className="flex items-center gap-3 py-2.5">
            <span
              aria-hidden
              className={`inline-block size-1.5 shrink-0 rounded-full ${CATEGORY_DOT[s.category]}`}
            />
            <span className="text-fg flex-1 text-sm font-medium tracking-tight">
              {s.label}
            </span>
            <span className="text-fg-subtle text-[11px] tracking-tight">
              {s.desc}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
