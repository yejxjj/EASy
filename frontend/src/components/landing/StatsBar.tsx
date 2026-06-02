"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_COLOR = "#4338CA";
const LS_KEY = "fides-stats-color";

interface Stat { label: string; value: string; caption: string; }

const STATS: Stat[] = [
  { label: "analysis pipeline",  value: "6",    caption: "단계 (크롤 → 스코어)" },
  { label: "public data sources", value: "4+",  caption: "전파인증 · 조달청 · TIPA · KORAIA" },
  { label: "patent · cert db",   value: "3",    caption: "KIPRIS · GS · NEP" },
  { label: "avg analysis time",  value: "~18s", caption: "mock 기준" },
];

export function StatsBar() {
  const [color, setColor]   = useState(DEFAULT_COLOR);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setColor(saved);
    } catch { /* ignore */ }
    setMounted(true);
  }, []);

  function handleChange(hex: string) {
    setColor(hex);
    try { localStorage.setItem(LS_KEY, hex); } catch { /* ignore */ }
  }

  function reset() {
    setColor(DEFAULT_COLOR);
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
  }

  const numColor = mounted ? color : DEFAULT_COLOR;

  return (
    <section
      aria-label="서비스 개요 통계"
      className="border-border bg-surface mx-auto max-w-7xl border-y px-6 py-8"
    >
      <dl className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col gap-1.5">
            <dt className="mono-eyebrow">{s.label}</dt>
            <dd
              className="text-3xl font-bold tracking-tight tabular-nums transition-colors"
              style={{ color: numColor }}
            >
              {s.value}
            </dd>
            <p className="text-fg-muted text-xs">{s.caption}</p>
          </div>
        ))}
      </dl>

      {/* ── 숫자 색상 테스터 ── */}
      {mounted && (
        <div className="border-border mt-6 flex items-center gap-3 border-t pt-4">
          {/* 스와치 버튼 */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="size-6 rounded-md border-2 border-white shadow-md transition-transform hover:scale-110 active:scale-95"
            style={{ background: color }}
            aria-label="숫자 색상 선택"
            title="숫자 색상 선택"
          />

          {/* 히든 컬러 인풋 */}
          <input
            ref={inputRef}
            type="color"
            value={color}
            onChange={(e) => handleChange(e.target.value)}
            className="sr-only"
            aria-hidden
          />

          {/* Hex 표시 */}
          <span className="mono-eyebrow tabular-nums">{color.toUpperCase()}</span>

          {/* RGB 표시 */}
          <span className="mono-eyebrow tabular-nums opacity-50">
            rgb({parseInt(color.slice(1,3),16)}, {parseInt(color.slice(3,5),16)}, {parseInt(color.slice(5,7),16)})
          </span>

          {/* 초기화 */}
          <button
            onClick={reset}
            className="mono-eyebrow ml-auto opacity-40 transition-opacity hover:opacity-100"
          >
            reset
          </button>
        </div>
      )}
    </section>
  );
}
