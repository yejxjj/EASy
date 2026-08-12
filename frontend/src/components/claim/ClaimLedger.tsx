import { cn } from "@/lib/cn";
import type { Claim, ClaimStatus } from "@/types/analysis";

/**
 * 대조 뷰 — 제품이 내세운 주장과 공공 기록을 나란히 놓고 선으로 잇는다.
 *
 * 이 서비스의 결론은 점수가 아니라 "붙지 않고 남은 주장"이므로,
 * 끊긴 연결이 눈에 먼저 들어오도록 설계했다.
 *
 * 랜딩과 결과 페이지가 **같은 컴포넌트를 공유한다**. 둘을 따로 만들면
 * 랜딩만 멋지고 내부 화면은 따로 노는 문제가 그대로 재발한다.
 *
 * SVG 대신 HTML로 그린 이유:
 *   · viewBox 스케일링은 좁은 화면에서 본문 텍스트까지 같이 줄인다
 *   · 스크린리더가 `<ol>` 목록을 그대로 읽어준다
 *   · 연결선만 장식이므로 aria-hidden 하나로 끝난다
 */

interface StatusStyle {
  label: string;
  /** 연결선·라벨 색 */
  color: string;
  /** repeating-linear-gradient 의 실선/여백 구간. null 이면 실선 */
  dash: [on: number, off: number] | null;
  /** 선이 상대 카드까지 닿는가. 근거가 없으면 허공에서 끊긴다 */
  reaches: boolean;
}

const STATUS: Record<ClaimStatus, StatusStyle> = {
  verified: {
    label: "확인됨",
    color: "var(--color-verified)",
    dash: null,
    reaches: true,
  },
  partial: {
    label: "부분 일치",
    color: "var(--color-partial)",
    dash: [5, 3],
    reaches: true,
  },
  unsupported: {
    label: "대응 근거 없음",
    color: "var(--color-missing)",
    dash: [3, 4],
    reaches: false,
  },
};

/** 파선 패턴을 배경으로 만든다. border-style: dashed 는 간격을 못 정한다. */
function dashBackground(style: StatusStyle, axis: "x" | "y") {
  const dir = axis === "x" ? "to right" : "to bottom";
  if (!style.dash) return style.color;
  const [on, off] = style.dash;
  return `repeating-linear-gradient(${dir}, ${style.color} 0 ${on}px, transparent ${on}px ${on + off}px)`;
}

export interface ClaimLedgerProps {
  claims: Claim[];
  /** 목록 아래 요약 줄을 감춘다 */
  hideSummary?: boolean;
  className?: string;
}

export function ClaimLedger({ claims, hideSummary, className }: ClaimLedgerProps) {
  if (claims.length === 0) {
    return (
      <div
        className={cn(
          "bg-surface text-fg-dim rounded-[var(--radius-panel)] px-5 py-10 text-center text-sm",
          className,
        )}
      >
        추출된 AI 주장이 없습니다.
      </div>
    );
  }

  const proven = claims.filter((c) => c.status === "verified").length;

  return (
    <div
      className={cn(
        "bg-surface rounded-[var(--radius-panel)] px-3 py-4 sm:px-5 sm:py-6",
        className,
      )}
    >
      <ol className="flex flex-col gap-3">
        {claims.map((claim, i) => (
          <ClaimRow key={claim.id} claim={claim} index={i} />
        ))}
      </ol>

      {hideSummary ? null : (
        <p className="text-fg-dim tnum mt-5 text-center font-mono text-xs">
          {claims.length}개 주장 중 {proven}개 입증 · 근거 부재율{" "}
          {Math.round(((claims.length - proven) / claims.length) * 100)}%
        </p>
      )}
    </div>
  );
}

function ClaimRow({ claim, index }: { claim: Claim; index: number }) {
  const style = STATUS[claim.status];
  const seq = String(index + 1).padStart(2, "0");
  const evidence = claim.evidence[0];

  return (
    <li className="grid grid-cols-1 items-center gap-2 md:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] md:gap-0">
      {/* 주장 */}
      <div className="bg-surface-strong rounded-[var(--radius-tile)] px-4 py-3">
        <p className="text-fg-faint font-mono text-xs tracking-[var(--tracking-label)]">
          CLAIM {seq}
        </p>
        <p className="text-fg mt-1.5 text-sm tracking-[var(--tracking-tight)]">
          {claim.text}
        </p>
        {claim.quote ? (
          <p className="text-fg-dim mt-1 truncate text-xs">“{claim.quote}”</p>
        ) : null}
      </div>

      {/* 연결선 — 장식 */}
      <Connector style={style} />

      {/* 근거 */}
      {style.reaches && evidence ? (
        <div
          className="bg-surface-strong rounded-[var(--radius-tile)] border px-4 py-3"
          style={{ borderColor: style.color }}
        >
          <p
            className="font-mono text-xs tracking-[var(--tracking-label)]"
            style={{ color: style.color }}
          >
            {style.label}
          </p>
          <p className="text-fg-muted mt-1.5 text-sm tracking-[var(--tracking-tight)]">
            {evidence.label}
          </p>
          {claim.evidence.length > 1 ? (
            <p className="text-fg-dim mt-1 text-xs">
              외 {claim.evidence.length - 1}건
            </p>
          ) : null}
        </div>
      ) : (
        <div className="px-4 py-1 md:py-3">
          <p
            className="font-mono text-xs tracking-[var(--tracking-label)]"
            style={{ color: style.color }}
          >
            {style.label}
          </p>
          {claim.note ? (
            <p className="text-fg-dim mt-1.5 font-mono text-xs">{claim.note}</p>
          ) : null}
        </div>
      )}
    </li>
  );
}

/**
 * 가로(md+)와 세로(모바일) 양쪽으로 그린다.
 * 근거가 없는 행은 선이 상대에 닿지 않고 점에서 끝난다 — 그게 결론이다.
 */
function Connector({ style }: { style: StatusStyle }) {
  const dot = (
    <span
      className="ledger-dot size-[5px] shrink-0 rounded-full"
      style={{ background: style.color }}
    />
  );

  return (
    <>
      {/* 모바일 — 세로 */}
      <span
        aria-hidden
        className="ml-6 flex flex-col items-center md:hidden"
        style={{ height: 18 }}
      >
        <span
          className="w-px flex-1"
          style={{ background: dashBackground(style, "y") }}
        />
        {style.reaches ? null : dot}
      </span>

      {/* 데스크톱 — 가로. 선이 좌에서 우로 자란다 (globals.css `.ledger-line`) */}
      <span aria-hidden className="hidden items-center px-2 md:flex">
        <span
          className="ledger-line h-px"
          style={{
            background: dashBackground(style, "x"),
            /* 닿지 않는 선은 짧게 끊고 점을 찍는다 */
            flex: style.reaches ? "1" : "0 0 56%",
          }}
        />
        {dot}
      </span>
    </>
  );
}
