"use client";

import { Download, RotateCcw, Share2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import type { AnalysisResult } from "@/types/analysis";

interface QuickActionsProps {
  data: AnalysisResult;
}

export function QuickActions({ data }: QuickActionsProps) {
  const onDownloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fides-analysis-${data.analysis_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <SectionHeader eyebrow="actions" title="빠른 작업" />
      <div className="flex flex-col gap-2 px-5 pt-1 pb-5">
        <Button asChild variant="cta" size="lg" className="w-full">
          <Link href="/">
            <RotateCcw size={16} aria-hidden />
            새 분석 시작
          </Link>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="w-full"
          onClick={onDownloadJson}
        >
          <Download size={14} aria-hidden />
          JSON 다운로드
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="w-full opacity-60"
          disabled
          title="공유 기능은 곧 출시됩니다"
        >
          <Share2 size={14} aria-hidden />
          공유 (준비 중)
        </Button>
      </div>
    </Card>
  );
}
