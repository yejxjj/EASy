import { AnalysisRunner } from "@/components/analysis/AnalysisRunner";

interface AnalysisPageProps {
  params: Promise<{ id: string }>;
}

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  const { id } = await params;
  return <AnalysisRunner id={id} />;
}
