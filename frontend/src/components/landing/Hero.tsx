import { Eyebrow } from "@/components/landing/Eyebrow";
import { FloatingShapes } from "@/components/landing/FloatingShapes";
import { UrlInputForm } from "@/components/landing/UrlInputForm";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Three faint background radials (ref recovery, opacity ≤ 0.07). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20"
        style={{ background: "var(--bg-landing-radials)" }}
      />
      <FloatingShapes />

      <div className="mx-auto flex max-w-4xl flex-col items-center gap-7 px-6 pt-16 pb-10 text-center md:pt-24 md:pb-14">
        <Eyebrow>AI 워싱 탐지 엔진 · v1.0</Eyebrow>

        <h1
          className="font-extrabold"
          style={{
            fontSize: "var(--font-size-hero)",
            lineHeight: "var(--line-height-hero)",
            letterSpacing: "var(--letter-spacing-hero)",
          }}
        >
          <span style={{ color: "#0e1120" }}>Fides</span>
        </h1>

        <p className="text-fg-muted/95 text-base leading-relaxed md:text-lg max-w-xl">
          제품 URL 하나로{" "}
          <strong className="text-fg font-semibold">텍스트 · 검증 · 관계형</strong>{" "}
          세 차원의 신뢰도를 분석해 허위 AI 주장을 데이터로 판별합니다.
        </p>

        <p className="text-fg-subtle font-mono text-[13px] tracking-[0.12em] uppercase">
          OCR · Gemini 정제 · 공공 인증 교차검증 · 특허 DB
        </p>

        <UrlInputForm />
      </div>
    </section>
  );
}
