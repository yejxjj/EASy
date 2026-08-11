import { cn } from "@/lib/cn";

/**
 * 근거 소스 목록.
 *
 * 값은 ontology/source_credibility_master.csv 에서 그대로 가져왔다.
 * 신뢰도 가중치까지 공개하는 이유는 단순하다 — 근거를 요구하는 서비스가
 * 자기 근거의 등급을 감추면 앞뒤가 맞지 않는다.
 *
 * 온톨로지 CSV 가 바뀌면 여기도 같이 고쳐야 한다. 나중에 백엔드가
 * 이 표를 내려주게 만들면 이중 관리가 사라진다.
 */

export interface EvidenceSource {
  name: string;
  role: string;
  /** credibility_weight — 0~1 */
  weight: number;
}

export function SourceTable({
  sources,
  className,
}: {
  sources: EvidenceSource[];
  className?: string;
}) {
  return (
    <ul className={cn("divide-border border-border divide-y border-y", className)}>
      {sources.map((source) => (
        <li
          key={source.name}
          className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 py-3 sm:grid-cols-[190px_1fr_auto]"
        >
          <span className="text-fg text-sm font-medium tracking-[var(--tracking-tight)]">
            {source.name}
          </span>
          <span className="text-fg-dim order-3 text-xs leading-relaxed sm:order-none">
            {source.role}
          </span>
          <span className="tnum text-fg-subtle font-mono text-xs" title="신뢰도 가중치">
            {source.weight.toFixed(2)}
          </span>
        </li>
      ))}
    </ul>
  );
}
