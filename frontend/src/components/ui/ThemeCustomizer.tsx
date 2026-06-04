"use client";

import { Palette, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/* ── 기본값 (globals.css 와 동일) ── */
const DEFAULTS = {
  gradFrom: "#63d9d1",
  gradTo:   "#7c5ff2",
  ok:       "#2db8b0",
  warn:     "#d4920a",
  danger:   "#e85d5d",
};

const LS_KEY = "fides-theme";
type Theme = typeof DEFAULTS;

/* ── 유틸 ── */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function darkenHex(hex: string, amount = 40): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  const r = clamp(parseInt(hex.slice(1, 3), 16) - amount);
  const g = clamp(parseInt(hex.slice(3, 5), 16) - amount);
  const b = clamp(parseInt(hex.slice(5, 7), 16) - amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/* ── CSS 변수 적용 ── */
function applyTheme(t: Theme) {
  const root = document.documentElement;

  /* 그라데이션 */
  root.style.setProperty("--color-brand",       t.gradFrom);
  root.style.setProperty("--color-brand-soft",  hexToRgba(t.gradFrom, 0.10));
  root.style.setProperty("--color-brand-fg",    darkenHex(t.gradTo, 30));
  root.style.setProperty(
    "--gradient-wordmark",
    `linear-gradient(120deg, ${t.gradFrom} 0%, ${t.gradTo} 60%, ${darkenHex(t.gradTo, 20)} 100%)`,
  );
  root.style.setProperty(
    "--gradient-cta",
    `linear-gradient(135deg, ${t.gradFrom} 0%, ${t.gradTo} 100%)`,
  );
  root.style.setProperty(
    "--shadow-glow-brand",
    `0 0 12px ${hexToRgba(t.gradFrom, 0.30)}`,
  );

  /* 배경 radial */
  root.style.setProperty(
    "--bg-landing-radials",
    `radial-gradient(ellipse 50% 60% at 80% -10%, ${hexToRgba(t.gradFrom, 0.07)} 0%, transparent 55%),
     radial-gradient(ellipse 40% 40% at -10% 70%, ${hexToRgba(t.gradTo, 0.06)} 0%, transparent 55%),
     radial-gradient(ellipse 30% 30% at 50% 100%, ${hexToRgba(darkenHex(t.gradTo, 20), 0.04)} 0%, transparent 50%)`,
  );

  /* 점수 티어 */
  root.style.setProperty("--color-ok",           t.ok);
  root.style.setProperty("--color-ok-soft",      hexToRgba(t.ok, 0.10));
  root.style.setProperty("--color-warn",         t.warn);
  root.style.setProperty("--color-warn-soft",    hexToRgba(t.warn, 0.10));
  root.style.setProperty("--color-danger",       t.danger);
  root.style.setProperty("--color-danger-soft",  hexToRgba(t.danger, 0.10));
}

/* ── 색상 스와치 + 인풋 ── */
function ColorSwatch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="size-9 rounded-xl border-2 border-white shadow-md transition-transform hover:scale-110 active:scale-95"
        style={{ background: value }}
        aria-label={`${label} 색상 선택`}
        title={label}
      />
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        aria-hidden
      />
      <span
        className="font-mono text-[9px] uppercase tracking-wide"
        style={{ color: "var(--color-fg-dim)" }}
      >
        {label}
      </span>
    </div>
  );
}

/* ── 메인 컴포넌트 ── */
export function ThemeCustomizer() {
  const [open, setOpen]     = useState(false);
  const [theme, setTheme]   = useState<Theme>(DEFAULTS);
  const [mounted, setMounted] = useState(false);

  /* localStorage에서 복원 */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Theme>;
        const merged = { ...DEFAULTS, ...parsed };
        setTheme(merged);
        applyTheme(merged);
      }
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  /* 색상 변경 → CSS 즉시 적용 + 저장 */
  function updateColor(key: keyof Theme, value: string) {
    const next = { ...theme, [key]: value };
    setTheme(next);
    applyTheme(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  /* 초기화 */
  function reset() {
    setTheme(DEFAULTS);
    applyTheme(DEFAULTS);
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
  }

  if (!mounted) return null;

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 grid size-11 place-items-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
        style={{ background: "var(--gradient-cta)" }}
        aria-label="테마 색상 편집"
        title="테마 색상 편집"
      >
        <Palette size={18} color="white" />
      </button>

      {/* 패널 */}
      {open && (
        <div
          className="fixed bottom-20 right-6 z-50 w-64 rounded-2xl border shadow-xl"
          style={{
            background: "var(--color-bg)",
            borderColor: "var(--color-border-strong)",
          }}
        >
          {/* 헤더 */}
          <div
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: "var(--color-border)" }}
          >
            <span className="text-sm font-semibold" style={{ color: "var(--color-fg)" }}>
              테마 색상
            </span>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 transition-colors hover:bg-surface"
              aria-label="닫기"
            >
              <X size={14} style={{ color: "var(--color-fg-dim)" }} />
            </button>
          </div>

          <div className="flex flex-col gap-5 p-4">

            {/* 그라데이션 */}
            <div>
              <p
                className="mb-3 font-mono text-[10px] uppercase tracking-widest"
                style={{ color: "var(--color-fg-dim)" }}
              >
                그라데이션 (로고 · 버튼)
              </p>
              <div className="flex items-center gap-3">
                <ColorSwatch
                  label="시작"
                  value={theme.gradFrom}
                  onChange={(v) => updateColor("gradFrom", v)}
                />
                {/* 미리보기 */}
                <div
                  className="h-3 flex-1 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${theme.gradFrom}, ${theme.gradTo})`,
                  }}
                />
                <ColorSwatch
                  label="끝"
                  value={theme.gradTo}
                  onChange={(v) => updateColor("gradTo", v)}
                />
              </div>
            </div>

            {/* 점수 티어 */}
            <div>
              <p
                className="mb-3 font-mono text-[10px] uppercase tracking-widest"
                style={{ color: "var(--color-fg-dim)" }}
              >
                점수 티어
              </p>
              <div className="flex justify-around">
                <ColorSwatch
                  label="양호"
                  value={theme.ok}
                  onChange={(v) => updateColor("ok", v)}
                />
                <ColorSwatch
                  label="주의"
                  value={theme.warn}
                  onChange={(v) => updateColor("warn", v)}
                />
                <ColorSwatch
                  label="위험"
                  value={theme.danger}
                  onChange={(v) => updateColor("danger", v)}
                />
              </div>
            </div>

            {/* 초기화 */}
            <button
              onClick={reset}
              className="flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-xs transition-colors hover:bg-surface"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-fg-muted)",
              }}
            >
              <RotateCcw size={12} />
              기본값으로 초기화
            </button>
          </div>
        </div>
      )}
    </>
  );
}
