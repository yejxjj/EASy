import { cn } from "@/lib/cn";

/**
 * 히어로 우측의 크롬 오브젝트.
 *
 * conic-gradient 블롭 두 겹과 스펙큘러 하이라이트 하나로 금속 반사를
 * 근사한다. 실제 3D 렌더(Spline·Blender)로 교체할 자리이며, 그때는
 * 이 컴포넌트 내부만 바꾸면 된다.
 *
 * 순수 장식이므로 접근성 트리에서 제외한다.
 */
export function ChromeObject({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none relative select-none", className)}
    >
      {/* 바깥 리본 */}
      <div
        className="absolute inset-0 -rotate-[15deg]"
        style={{
          background: "var(--gradient-chrome)",
          borderRadius: "64% 36% 52% 48% / 58% 44% 56% 42%",
        }}
      />
      {/* 안쪽 접힘 — 어두운 면이 겹쳐야 두께가 생긴다 */}
      <div
        className="absolute inset-[18%_22%_26%_20%] rotate-[24deg]"
        style={{
          background:
            "conic-gradient(from 44deg, #0a2790, #4fa8f0, #081b6e, #9fe0ff, #1240c8, #0a2790)",
          borderRadius: "52% 48% 60% 40% / 46% 58% 42% 54%",
        }}
      />
      {/* 스펙큘러 — 광원은 항상 좌상단 */}
      <div
        className="absolute top-[22%] left-[30%] h-[18%] w-[28%] -rotate-[20deg]"
        style={{
          background:
            "radial-gradient(ellipse at 34% 30%, rgba(255,255,255,.96), rgba(255,255,255,0) 70%)",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}
