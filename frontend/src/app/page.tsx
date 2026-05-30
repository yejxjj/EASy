import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Hero } from "@/components/landing/Hero";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { SampleAnalysisPreview } from "@/components/landing/SampleAnalysisPreview";
import { StatsBar } from "@/components/landing/StatsBar";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10 pb-8 md:gap-12">
      <Hero />
      <StatsBar />
      <FeatureGrid />
      <SampleAnalysisPreview />
      <LandingFaq />
    </div>
  );
}
