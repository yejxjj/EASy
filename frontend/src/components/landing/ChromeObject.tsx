import { cn } from "@/lib/cn";

/**
 * 히어로의 크롬 오브젝트 — 기울어진 토러스.
 *
 * 세 겹으로 쌓아 금속 링을 근사한다:
 *   1. 바깥 링   conic-gradient 를 mask 로 도넛 모양으로 뚫는다
 *   2. 안쪽 원반 링 안쪽으로 보이는 반대편 면
 *   3. 하이라이트 광원은 항상 좌상단 — 페이지 전체가 이 전제를 공유한다
 *
 * 로고 마크(FidesMark)와 같은 조형이다. 실제 3D 렌더로 교체할 자리이며,
 * 그때는 이 컴포넌트 내부만 바꾸면 된다.
 *
 * 순수 장식이므로 접근성 트리에서 제외한다.
 */
export function ChromeObject({ className }: { className?: string }) {
  const donut = "radial-gradient(closest-side, transparent 56%, #000 57%)";

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none relative select-none", className)}
    >
      <div className="absolute inset-0 -rotate-[24deg]">
        {/* 바깥 링 */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 202deg, #eaf5ff, #4d9bf0, #bdeeff, #0f35b4, #f2f8ff, #2e7fe8, #eaf5ff)",
            WebkitMaskImage: donut,
            maskImage: donut,
          }}
        />

        {/* 안쪽 원반 — 링 너머로 보이는 반대편 */}
        <div
          className="absolute inset-[23%] rounded-full"
          style={{
            background:
              "conic-gradient(from 148deg, #12307e, #3f79d8, #0a1f6e, #1b4fc0, #12307e)",
          }}
        />

        {/* 스펙큘러 — 좌상단 광원 */}
        <div
          className="absolute rounded-full"
          style={{
            left: "29%",
            top: "27%",
            width: "23%",
            height: "16%",
            background:
              "radial-gradient(ellipse at 42% 34%, #ffffff, rgba(255,255,255,0) 74%)",
          }}
        />
      </div>
    </div>
  );
}
