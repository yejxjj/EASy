import {
  CLAIM_STATUS,
  dashBackground,
  type StatusStyle,
} from "@/lib/claimStatus";
import { cn } from "@/lib/cn";
import type { Claim } from "@/types/analysis";

/**
 * 대조 뷰 — 제품이 내세운 주장과 공공 기록을 나란히 놓고 선으로 잇는다.
 *
 * 이 서비스의 결론은 점수가 아니라 "붙지 않고 남은 주장"이므로,
 * 끊긴 연결이 눈에 먼저 들어오도록 설계했다.
 *
 * 주장이 열댓 개로 늘어나도 훑을 수 있는 형태다. 결과 페이지와 디자인
 * 레퍼런스가 이걸 쓴다. 랜딩은 주장이 셋뿐이라 같은 데이터를 조회 매트릭스로
 * 보여준다(ClaimMatrix) — 형태는 둘이지만 색·파선·라벨은 lib/claimStatus.ts
 * 한 곳에서만 정의해 두 화면이 다른 언어를 쓰지 않게 한다.
 *
 * 카드로 감싸지 않는다. 테두리와 배경을 두른 상자를 세 줄 쌓으면 어느
 * 서비스에나 있는 목록이 된다. 괘선으로만 나누고 연결선이 구조를 맡는다.
 *
 * SVG 대신 HTML로 그린 이유:
 *   · viewBox 스케일링은 좁은 화면에서 본문 텍스트까지 같이 줄인다
 *   · 스크린리더가 `<ol>` 목록을 그대로 읽어준다
 *   · 연결선만 장식이므로 aria-hidden 하나로 끝난다
 */

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
          "border-border text-fg-dim border-y px-5 py-10 text-center text-sm",
          className,
        )}
      >
        추출된 AI 주장이 없습니다.
      </div>
    );
  }

  const proven = claims.filter((c) => c.status === "verified").length;

  return (
    <div className={className}>
      <ol className="divide-border border-border divide-y border-y">
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
  const style = CLAIM_STATUS[claim.status];
  const seq = String(index + 1).padStart(2, "0");
  const evidence = claim.evidence[0];

  return (
    <li className="grid grid-cols-1 items-center gap-2 py-5 md:grid-cols-[minmax(0,1fr)_76px_minmax(0,1fr)] md:gap-0">
      {/* 주장 */}
      <div className="md:pr-5">
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
        <div className="md:pl-5">
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
        <div className="md:pl-5">
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
