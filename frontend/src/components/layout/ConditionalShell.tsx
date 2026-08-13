"use client";

import { usePathname } from "next/navigation";

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // 랜딩·시안·디자인 갤러리·검토용 변형은 자체 헤더와 푸터를 갖는다
  const isBare =
    pathname === "/" ||
    pathname === "/demo" ||
    pathname === "/design" ||
    pathname.startsWith("/preview/");

  if (isBare) return <>{children}</>;

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </>
  );
}
