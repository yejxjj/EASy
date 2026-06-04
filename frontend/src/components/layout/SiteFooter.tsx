import { Badge } from "@/components/primitives/Badge";

export function SiteFooter() {
  const apiMode = process.env.NEXT_PUBLIC_API_MODE;
  return (
    <footer className="border-border mt-20 border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-fg-subtle">
          © {new Date().getFullYear()} Fides · AI Washing Detection
        </p>
        <p className="text-fg-dim hidden font-mono text-[11px] tracking-tight md:block">
          v0.1.0 · pipeline mock-v1 · 평균 18s
        </p>
        <div className="flex items-center gap-3">
          {apiMode === "mock" ? (
            <Badge intent="warn" title="현재 백엔드가 mock 어댑터로 동작합니다.">
              <span className="font-mono uppercase tracking-tight">mock backend</span>
            </Badge>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
