"use client";

import { usePathname } from "next/navigation";

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBare = pathname === "/" || pathname === "/demo";

  if (isBare) return <>{children}</>;

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </>
  );
}
