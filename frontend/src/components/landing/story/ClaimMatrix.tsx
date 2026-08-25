"use client";

import { animate, createTimeline, stagger, text, utils } from "animejs";
import { useEffect, useRef } from "react";

import { CLAIM_STATUS } from "@/lib/claimStatus";
import { cn } from "@/lib/cn";
import type { ClaimStatus } from "@/types/analysis";

/**
 * 대조 뷰 — 주장 × 공공 기록 조회 결과.
 *
 * 앞선 시도는 주장과 근거를 양쪽에 세우고 곡선으로 이었다. 개념은 맞지만
 * 선이 화면을 가로지르며 서로 교차해 지저분했고, 정작 "무엇을 얼마나
 * 찾았는가"라는 숫자는 어디에도 없었다.
 *
 * 그래서 선을 걷어내고 표로 바꿨다. 열은 조회한 소스, 행은 주장, 칸은
 * 찾은 건수다. **한 행이 전부 0이면 그 문장은 근거가 없다** — 결론이
 * 문장이 아니라 격자의 모양으로 먼저 읽힌다. 0이 몇 개인지 세지 않아도
 * 비어 있는 줄이 눈에 걸린다.
 *
 * 0건 소스를 지우지 않는 이유도 같다. 빈 칸은 "안 찾아봤다"로 읽히지만
 * 0은 "찾아봤는데 없었다"가 된다. 이 서비스가 파는 것이 그 차이다.
 *
 * anime.js 가 조회를 재연한다:
 *
 *   1. 소스 열이 왼쪽부터 하나씩 조회된다 — 열 머리의 막대가 차오르고
 *   2. 그 열의 세 칸이 위에서 아래로 켜지며 숫자가 굴러가다 확정된다
 *      (scrambleText, 숫자만 사용)
 *   3. 다섯 열이 끝나면 판정이 위에서 아래로 찍힌다
 *   4. 근거가 없는 행은 그때 그 행의 0들이 한 번 튄다 — 붉은 판정이
 *      어디서 나왔는지 되짚어 준다
 *
 * 행에 마우스를 올리면 반복이 멈추고 그 행만 남아 다시 조회한다.
 *
 * 좁은 화면(< lg)에서는 표를 접고 주장별 블록이 된다. 일곱 열은 어떤
 * 방법으로도 375px 에 들어가지 않는다.
 */

export interface MatrixSource {
  id: string;
  /** 기관 약칭. 열 머리의 첫 줄 */
  name: string;
  /** 무엇을 조회했는가. 열 머리의 둘째 줄 */
  detail: string;
}

export interface MatrixClaim {
  id: string;
  /** 제품이 내세운 기능 이름 */
  text: string;
  /** 페이지에서 실제로 매칭된 광고 문구 */
  quote: string;
  status: ClaimStatus;
  /** 소스 id → 찾은 건수. 없으면 0 */
  hits: Record<string, number>;
}

/** 소스 한 곳을 조회하고 다음으로 넘어가는 간격 */
const COL = 330;
/** 판정이 한 행씩 찍히는 간격 */
const VERDICT = 260;
/** 다 돌고 쉬는 시간 */
const REST = 1800;

export function ClaimMatrix({
  claims,
  sources,
  className,
}: {
  claims: MatrixClaim[];
  sources: MatrixSource[];
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const pick = <T extends Element>(sel: string) =>
      Array.from(root.querySelectorAll<T>(sel));
    const one = <T extends Element>(sel: string) => root.querySelector<T>(sel);

    const bars = pick<HTMLElement>("[data-colbar]");
    const cells = pick<HTMLElement>("[data-cell]");
    const verdicts = pick<HTMLElement>("[data-verdict]");
    const rows = pick<HTMLElement>("[data-row]");

    /** 다 조회된 정지 화면 */
    const settle = () => {
      utils.set(bars, { scaleX: 1 });
      utils.set(cells, { opacity: 1, translateY: 0, scale: 1 });
      utils.set(verdicts, { opacity: 1, scale: 1 });
      utils.set(rows, { opacity: 1 });
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      settle();
      return;
    }

    utils.set(bars, { scaleX: 0 });
    utils.set(cells, { opacity: 0 });
    utils.set(verdicts, { opacity: 0 });

    const loop = createTimeline({ loop: true, autoplay: false });

    /* ── 소스를 왼쪽부터 하나씩 조회한다 ─────────────────────────── */
    sources.forEach((source, i) => {
      const at = i * COL;
      const bar = one<HTMLElement>(`[data-colbar="${source.id}"]`);
      const colCells = pick<HTMLElement>(`[data-cell][data-col="${source.id}"]`);
      if (bar) {
        loop.add(
          bar,
          { scaleX: [{ from: 0, to: 1, duration: 360, ease: "out(3)" }] },
          at,
        );
      }
      if (colCells.length) {
        loop.add(
          colCells,
          {
            opacity: [{ from: 0, to: 1, duration: 260 }],
            translateY: [{ from: 5, to: 0, duration: 260, ease: "out(3)" }],
            delay: stagger(75),
          },
          at,
        );
        /* 숫자가 굴러가다 확정된다 — 조회 결과가 도착하는 소리 */
        loop.add(
          colCells,
          {
            text: text.scrambleText({ chars: "numbers", duration: 420 }),
            delay: stagger(75),
          },
          at,
        );
      }
    });

    /* ── 다 조회한 뒤 판정이 찍힌다 ──────────────────────────────── */
    const after = sources.length * COL;
    claims.forEach((claim, i) => {
      const at = after + i * VERDICT;
      const verdict = one<HTMLElement>(`[data-verdict="${claim.id}"]`);
      if (verdict) {
        loop.add(
          verdict,
          {
            opacity: [{ from: 0, to: 1, duration: 240 }],
            scale: [{ from: 1.45, to: 1, duration: 360, ease: "out(3)" }],
          },
          at,
        );
      }
      /* 근거가 없는 행은 그 행의 0들이 한 번 튄다 — 붉은 판정의 출처다 */
      if (!CLAIM_STATUS[claim.status].reaches) {
        const zeros = pick<HTMLElement>(`[data-cell][data-claim="${claim.id}"]`);
        if (zeros.length) {
          loop.add(
            zeros,
            {
              scale: [
                { from: 1, to: 1.4, duration: 170, ease: "out(3)" },
                { to: 1, duration: 400, ease: "inOut(2)" },
              ],
              delay: stagger(55),
            },
            at + 60,
          );
        }
      }
    });

    /* 마지막 여백 — 타임라인을 늘려 다음 바퀴 전에 정적을 만든다 */
    if (bars.length) {
      loop.add(
        bars[0],
        { scaleX: 1, duration: REST },
        after + claims.length * VERDICT,
      );
    }

    /* ── 손을 올리면 멈추고 그 행만 다시 조회한다 ────────────────── */
    const off: Array<() => void> = [];
    claims.forEach((claim) => {
      const row = one<HTMLElement>(`[data-row="${claim.id}"]`);
      if (!row) return;
      const mine = pick<HTMLElement>(`[data-cell][data-claim="${claim.id}"]`);

      const isolate = () => {
        loop.pause();
        settle();
        animate(
          rows.filter((r) => r !== row),
          { opacity: 0.3, duration: 260, ease: "out(2)" },
        );
        animate(mine, {
          text: text.scrambleText({ chars: "numbers", duration: 420 }),
          delay: stagger(70),
        });
      };
      const restore = () => {
        animate(rows, {
          opacity: 1,
          duration: 240,
          ease: "out(2)",
          onComplete: () => loop.play(),
        });
      };

      row.addEventListener("pointerenter", isolate);
      row.addEventListener("pointerleave", restore);
      off.push(() => {
        row.removeEventListener("pointerenter", isolate);
        row.removeEventListener("pointerleave", restore);
      });
    });

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        loop.play();
      },
      { threshold: 0.25 },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      off.forEach((fn) => fn());
      loop.revert();
    };
  }, [claims, sources]);

  return (
    <div ref={rootRef} className={className}>
      {/* ── 넓은 화면 — 격자 ─────────────────────────────────────── */}
      {/* 칸 너비를 고정한다. 자동 폭에 맡기면 열마다 89~141px 로 들쭉날쭉해져
          숫자가 격자로 읽히지 않는다. */}
      <table className="hidden w-full table-fixed border-collapse lg:table">
        <thead>
          <tr>
            <th className="w-[32%] pb-3.5 text-left align-bottom">
              <span className="text-fg-faint font-mono text-xs tracking-[var(--tracking-label)]">
                제품이 내세운 주장
              </span>
            </th>
            {sources.map((source) => (
              <th
                key={source.id}
                className="w-[9.6%] px-2 pb-3.5 text-left align-bottom"
              >
                <span className="text-fg-muted block font-mono text-xs">
                  {source.name}
                </span>
                <span className="text-fg-faint mt-0.5 block text-[10px]">
                  {source.detail}
                </span>
                <span
                  data-colbar={source.id}
                  aria-hidden
                  className="matrix-bar mt-2.5 block h-[2px] w-full"
                  style={{ background: "var(--color-verified)" }}
                />
              </th>
            ))}
            <th className="w-[20%] pb-3.5 text-right align-bottom">
              <span className="text-fg-faint font-mono text-xs tracking-[var(--tracking-label)]">
                판정
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {claims.map((claim, i) => {
            const style = CLAIM_STATUS[claim.status];
            return (
              <tr
                key={claim.id}
                data-row={claim.id}
                className="border-border border-t align-top"
              >
                <td className="py-5 pr-8">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-fg-faint font-mono text-xs tracking-[var(--tracking-label)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-fg text-sm tracking-[var(--tracking-tight)]">
                      {claim.text}
                    </span>
                  </div>
                  <p className="text-fg-dim mt-1 text-xs">“{claim.quote}”</p>
                </td>

                {sources.map((source) => {
                  const n = claim.hits[source.id] ?? 0;
                  return (
                    <td key={source.id} className="px-2 py-5">
                      <span
                        data-cell
                        data-col={source.id}
                        data-claim={claim.id}
                        className={cn(
                          "matrix-cell tnum inline-block font-mono text-sm",
                          n > 0 ? "font-medium" : "",
                        )}
                        style={{
                          color:
                            n > 0
                              ? "var(--color-verified)"
                              : "var(--color-fg-faint)",
                        }}
                      >
                        {n}
                      </span>
                    </td>
                  );
                })}

                <td className="py-5 text-right">
                  <span
                    data-verdict={claim.id}
                    className="matrix-verdict inline-block origin-right font-mono text-xs tracking-[var(--tracking-label)]"
                    style={{ color: style.color }}
                  >
                    {style.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ── 좁은 화면 — 주장별 블록 ──────────────────────────────── */}
      <ul className="flex flex-col gap-7 lg:hidden">
        {claims.map((claim, i) => {
          const style = CLAIM_STATUS[claim.status];
          return (
            <li key={claim.id} className="border-border border-t pt-4">
              <div className="flex items-baseline gap-2.5">
                <span className="text-fg-faint font-mono text-xs tracking-[var(--tracking-label)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-fg text-sm tracking-[var(--tracking-tight)]">
                  {claim.text}
                </span>
              </div>
              <p className="text-fg-dim mt-1 text-xs">“{claim.quote}”</p>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                {sources.map((source) => {
                  const n = claim.hits[source.id] ?? 0;
                  return (
                    <li
                      key={source.id}
                      className="text-fg-dim font-mono text-xs"
                    >
                      {source.name} {source.detail}{" "}
                      <span
                        className="tnum"
                        style={{
                          color:
                            n > 0
                              ? "var(--color-verified)"
                              : "var(--color-fg-faint)",
                          fontWeight: n > 0 ? 500 : 400,
                        }}
                      >
                        {n}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p
                className="mt-3 font-mono text-xs tracking-[var(--tracking-label)]"
                style={{ color: style.color }}
              >
                {style.label}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
