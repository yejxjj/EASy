export function SiteFooter() {
  const apiMode = process.env.NEXT_PUBLIC_API_MODE;
  return (
    <footer style={{
      borderTop: "1px solid rgba(14,17,32,.08)",
      background: "#f4f6fb",
      marginTop: "auto",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        padding: "22px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: ".28em", textTransform: "uppercase", color: "rgba(14,17,32,.35)" }}>
          Fides
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(14,17,32,.22)", letterSpacing: ".06em" }}>
          AI Reliability Analysis · 2025 {apiMode === "mock" ? "· mock backend" : ""}
        </span>
      </div>
    </footer>
  );
}
