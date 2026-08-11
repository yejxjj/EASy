import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

import { ConditionalShell } from "@/components/layout/ConditionalShell";

import "./globals.css";

const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "100 900",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
});

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
      className={`${pretendard.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        {/* 진입 연출은 JS 로 클래스를 붙여 켠다. 스크립트가 없으면
            숨김만 남아 페이지가 비어 보이므로 여기서 되돌린다. */}
        <noscript>
          <style>{`.reveal-group > *{opacity:1;transform:none}.ledger-line,.bar-fill{transform:scaleX(1)}.ledger-dot{opacity:1}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-full flex-col">
        <ConditionalShell>{children}</ConditionalShell>
      </body>
    </html>
  );
}
