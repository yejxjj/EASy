import { AlertBanner } from "@/components/result/AlertBanner";
import { DashboardShell } from "@/components/result/DashboardShell";
import { DataSourceList } from "@/components/result/DataSourceList";
import { KpiCardGrid } from "@/components/result/KpiCardGrid";
import { MetaSidebar } from "@/components/result/MetaSidebar";
import { QuickActions } from "@/components/result/QuickActions";
import { ResultFooterCta } from "@/components/result/ResultFooterCta";
import { ResultHero } from "@/components/result/ResultHero";
import { VerificationTable } from "@/components/result/VerificationTable";
import { XaiFindings } from "@/components/result/XaiFindings";
import type { AnalysisResult } from "@/types/analysis";

/**
 * Result dashboard. Uses `DashboardShell` to lay out:
 *   - row 1 (col 12) ResultHero — product + overall ScoreGauge + meta
 *   - row 2 (col 12) AlertBanner — tier-aware messaging
 *   - row 3 (col 8 main + col 4 sticky sidebar):
 *       main:    KpiCardGrid → XaiFindings → VerificationTable
 *       sidebar: MetaSidebar → QuickActions → DataSourceList
 *   - row 4 (col 12) ResultFooterCta
 */
export function ResultView({ data }: { data: AnalysisResult }) {
  return (
    <DashboardShell
      hero={<ResultHero data={data} />}
      alert={
        <AlertBanner
          overallScore={data.scores.overall}
          overallLabel={data.scores.overall_label}
        />
      }
      main={
        <>
          <KpiCardGrid scores={data.scores} />
          <XaiFindings findings={data.xai_findings} />
          <VerificationTable verification={data.verification} />
        </>
      }
      sidebar={
        <>
          <MetaSidebar data={data} />
          <QuickActions data={data} />
          <DataSourceList />
        </>
      }
      footer={<ResultFooterCta />}
    />
  );
}
