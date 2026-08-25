import type { Metadata } from "next";
import localFont from "next/font/local";

import { ConditionalShell } from "@/components/layout/ConditionalShell";

import "./globals.css";

const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "100 900",
});

/* 모노 글꼴은 싣지 않는다. 작은 라벨까지 본문과 같은 Pretendard 로 두기로
   했으므로(globals.css 의 `--font-mono` 참고) 내려받을 이유가 없다. */

export const metadata: Metadata = {
  title: "Fides — AI Washing Detection",
  description:
    "다나와 상품 URL을 분석해 AI 워싱 위험도와 근거를 산정합니다. 텍스트·검증·관계형 3축 신뢰도와 XAI 핵심 판단 근거를 함께 제공합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} h-full antialiased`}
    >
      <head>
        {/* 진입 연출은 JS 로 클래스를 붙여 켠다. 스크립트가 없으면
            숨김만 남아 페이지가 비어 보이므로 여기서 되돌린다. */}
        <noscript>
          <style>{`.reveal-group > *{opacity:1;transform:none}.ledger-line,.bar-fill,.step-fill,.matrix-bar,.src-bar{transform:scaleX(1)}.contrast-rule{transform:scaleY(1)}.ledger-dot,.matrix-cell,.matrix-verdict{opacity:1}.claim-layer{opacity:1}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-full flex-col">
        <ConditionalShell>{children}</ConditionalShell>
      </body>
    </html>
  );
}
