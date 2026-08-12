import { cn } from "@/lib/cn";

/**
 * 다크 섹션 좌측의 얇은 곡선 다발.
 *
 * 검정 면이 그대로 비면 허전하고, 그렇다고 그라데이션을 깔면 탁해진다.
 * 선 몇 가닥이 밀도를 만들면서도 배경으로 물러난다.
 *
 * `preserveAspectRatio="none"` 으로 섹션 높이에 맞춰 늘어난다.
 *
 * 위아래로 80px 씩 물려 둔다 — 시차(section-parallax)로 움직일 때
 * 섹션 모서리에 빈 틈이 생기지 않게 하는 여유분이다. 섹션이
 * overflow-hidden 이라 넘치는 부분은 잘린다.
 */
export function WaveLines({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 300"
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute -inset-y-20 left-0", className)}
    >
      {[10, 30, 50, 70, 90, 110].map((y, i) => (
        <path
          key={y}
          d={`M-20,${y} C${60 + i * 12},${y + 50} ${60 + i * 12},${y + 110} -20,${y + 160}`}
          fill="none"
          stroke={i % 2 === 0 ? "#16407a" : "#1a4c90"}
          strokeWidth="0.8"
        />
      ))}
    </svg>
  );
}
