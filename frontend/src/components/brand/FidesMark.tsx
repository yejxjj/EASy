import { cn } from "@/lib/cn";

/**
 * Fides 심볼 — 기울어진 크롬 링.
 *
 * 히어로의 큰 오브젝트(ChromeObject)와 같은 형태를 작은 크기로 줄인 것이다.
 * 워드마크 옆에 붙는 마크와 히어로 오브젝트가 같은 조형이어야 하나의
 * 아이덴티티로 읽힌다.
 *
 * 작은 크기에서는 안쪽 원반과 하이라이트가 몇 px 로 뭉개지므로 링만 남겼다.
 *
 * 워드마크 텍스트가 옆에 붙는 것이 기본이라 장식으로 취급한다.
 * 마크만 단독으로 쓸 때는 `label` 을 넘겨 이름을 준다.
 */
export function FidesMark({
  size = 22,
  label,
  className,
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={Math.round((size * 32) / 36)}
      viewBox="0 0 36 32"
      className={cn("shrink-0", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        {/* 동일한 정의가 여러 번 렌더돼도 브라우저는 첫 번째를 쓴다 —
            내용이 같으므로 결과는 항상 동일하다. */}
        <linearGradient id="fides-mark-chrome" x1="0.06" y1="0.08" x2="0.94" y2="0.92">
          <stop offset="0" stopColor="#eaf5ff" />
          <stop offset="0.26" stopColor="#5aa4f2" />
          <stop offset="0.5" stopColor="#0f35b4" />
          <stop offset="0.72" stopColor="#8fd4ff" />
          <stop offset="1" stopColor="#e8f4ff" />
        </linearGradient>
      </defs>
      <ellipse
        cx="18"
        cy="16"
        rx="13"
        ry="9.2"
        transform="rotate(-22 18 16)"
        fill="none"
        stroke="url(#fides-mark-chrome)"
        strokeWidth="6"
      />
    </svg>
  );
}
