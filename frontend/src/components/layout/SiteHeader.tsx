import Link from "next/link";

import { AuthNav } from "@/components/layout/AuthNav";

export function SiteHeader() {
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 30,
      height: 56,
      background: "rgba(244,246,251,.92)",
      borderBottom: "1px solid rgba(14,17,32,.08)",
      backdropFilter: "blur(12px)",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: "100%", padding: "0 32px",
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: 15, fontWeight: 600, letterSpacing: ".28em",
            textTransform: "uppercase", color: "#0e1120",
          }}>
            Fides
          </span>
          <span style={{
            fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase",
            color: "rgba(14,17,32,.3)", fontWeight: 400,
          }}>
            AI Analysis
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 15 }}>
          <Link href="/dashboard" style={{
            color: "rgba(14,17,32,.48)", textDecoration: "none",
            fontSize: 14, letterSpacing: ".01em", transition: "color .2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(14,17,32,.85)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(14,17,32,.48)")}
          >
            대시보드
          </Link>

          <AuthNav />

          <Link href="/" style={{
            fontSize: 14, fontWeight: 400, letterSpacing: ".02em",
            padding: "6px 18px", border: "1px solid rgba(14,17,32,.25)",
            borderRadius: 6, color: "rgba(14,17,32,.65)",
            background: "transparent", textDecoration: "none",
            transition: "all .2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(14,17,32,.05)"; e.currentTarget.style.borderColor = "rgba(14,17,32,.45)"; e.currentTarget.style.color = "#0e1120"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(14,17,32,.25)"; e.currentTarget.style.color = "rgba(14,17,32,.65)"; }}
          >
            분석 시작 →
          </Link>
        </nav>
      </div>
    </header>
  );
}
