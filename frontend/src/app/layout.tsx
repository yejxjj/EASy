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
    "상품 페이지의 AI 주장을 공공 기록과 대조해 근거가 붙는지 확인합니다. 기술 근거(특허·공시) · 공인 인증(KC·전파) · 기관 이력 세 축으로 나누어 판단 근거를 함께 보여줍니다.",
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
