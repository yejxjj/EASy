"use client";

import { animate, stagger, text, utils } from "animejs";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/cn";

/**
 * 근거 소스 목록.
 *
 * 값은 ontology/source_credibility_master.csv 에서 그대로 가져왔다.
 * 신뢰도 가중치까지 공개하는 이유는 단순하다 — 근거를 요구하는 서비스가
 * 자기 근거의 등급을 감추면 앞뒤가 맞지 않는다.
 *
 * 숫자만 오른쪽에 세워 두면 0.95 와 0.72 의 차이가 읽히지 않는다. 그래서
 * 가중치에 비례한 막대를 붙였다. 0~1 을 그대로 쓴다 — 0.6~1.0 으로 늘려
 * 잡으면 차이가 극적으로 보이지만 그건 이 서비스가 하지 말라고 하는 짓이다.
 *
 * 화면에 들어오면 아홉 줄의 막대가 거의 동시에 차오르고 숫자가 굴러가다
 * 확정된다. 간격을 45ms 로 아주 좁게 준 것은 카피가 "병렬로 조회합니다"
 * 이기 때문이다 — 한 줄씩 순서대로 훑으면 직렬로 읽힌다.
 * 줄에 손을 올리면 그 줄만 다시 조회한다.
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
  dense,
  className,
}: {
  sources: EvidenceSource[];
  /**
   * 반 폭 칸에 들어갈 때. 이름과 설명을 가로로 늘어놓으면 둘 다 짓눌리므로
   * 설명을 이름 아래로 내린다.
   */
  dense?: boolean;
  className?: string;
}) {
  const rootRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const bars = Array.from(root.querySelectorAll<HTMLElement>("[data-bar]"));
    const weights = Array.from(
      root.querySelectorAll<HTMLElement>("[data-weight]"),
    );

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      utils.set(bars, { scaleX: 1 });
      return;
    }

    const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-row]"));

    /** 한 줄을 조회한다 — 막대가 차오르고 숫자가 확정된다 */
    const query = (bar: HTMLElement | null, weight: HTMLElement | null) => {
      if (bar) {
        animate(bar, {
          scaleX: [{ from: 0, to: 1 }],
          duration: 820,
          ease: "out(3)",
        });
      }
      if (weight) {
        animate(weight, {
          text: text.scrambleText({ chars: "0123456789.", duration: 520 }),
        });
      }
    };

    utils.set(bars, { scaleX: 0 });

    const off: Array<() => void> = [];
    rows.forEach((row) => {
      const fn = () =>
        query(
          row.querySelector<HTMLElement>("[data-bar]"),
          row.querySelector<HTMLElement>("[data-weight]"),
        );
      row.addEventListener("pointerenter", fn);
      off.push(() => row.removeEventListener("pointerenter", fn));
    });

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        /* 간격을 좁게 — 아홉 곳을 한꺼번에 두드린다는 뜻이다 */
        animate(bars, {
          scaleX: [{ from: 0, to: 1 }],
          duration: 820,
          delay: stagger(45),
          ease: "out(3)",
        });
        animate(weights, {
          text: text.scrambleText({ chars: "0123456789.", duration: 520 }),
          delay: stagger(45),
        });
      },
      { threshold: 0.2 },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      off.forEach((fn) => fn());
      utils.remove([...bars, ...weights]);
    };
  }, [sources]);

  return (
    <ul
      ref={rootRef}
      className={cn("divide-border border-border divide-y border-y", className)}
    >
      {sources.map((source) => (
        <li
          key={source.name}
          data-row
          className={cn(
            "grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-3",
            dense
              ? "items-center"
              : "items-baseline sm:grid-cols-[190px_1fr_auto]",
          )}
        >
          <span
            className={cn(
              "text-fg text-sm font-medium tracking-[var(--tracking-tight)]",
              dense && "block",
            )}
          >
            {source.name}
          </span>
          <span
            className={cn(
              "text-fg-dim text-xs leading-relaxed",
              dense
                ? "order-3 col-span-2 -mt-0.5"
                : "order-3 sm:order-none",
            )}
          >
            {source.role}
          </span>

          <span className="flex items-center gap-3 self-center">
            {/* 가중치 막대 — 숫자만으로는 서열이 안 읽힌다 */}
            <span
              aria-hidden
              className="hidden h-[3px] w-16 overflow-hidden rounded-full sm:block"
              style={{ background: "var(--color-border)" }}
            >
              <span
                data-bar
                className="src-bar block h-full rounded-full"
                style={{
                  width: `${source.weight * 100}%`,
                  background: "var(--color-brand-fg)",
                }}
              />
            </span>
            <span
              data-weight
              className="tnum text-fg-subtle text-xs"
              title="신뢰도 가중치"
            >
              {source.weight.toFixed(2)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
