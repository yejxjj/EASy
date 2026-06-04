/**
 * Analysis data types.
 *
 * 1:1 mirror of `backend/app/schemas/analysis.py` and `progress.py`.
 * Until we adopt automated OpenAPI → TS generation, every backend schema
 * change must be reflected here in the same commit.
 */

export type AnalyzerBackendName = "mock" | "real";
export type OverallLabel = "양호 구간" | "주의 구간" | "위험 구간";
export type ProductSource = "danawa";
export type XaiCategory = "washing" | "verification" | "relational";
export type XaiDirection = "up" | "down";
export type VerificationIntent = "ok" | "warn" | "neutral";

export type JobStatus = "queued" | "running" | "completed" | "failed";

export type StageName =
  | "crawl"
  | "ocr"
  | "llm_refine"
  | "public_verify"
  | "patent_search"
  | "score";

export type StageState = "wait" | "running" | "done" | "error";

export const STAGE_ORDER: StageName[] = [
  "crawl",
  "ocr",
  "llm_refine",
  "public_verify",
  "patent_search",
  "score",
];

export const STAGE_LABELS: Record<StageName, { name: string; sub: string }> = {
  crawl: { name: "URL 크롤링", sub: "페이지 수집" },
  ocr: { name: "이미지 OCR", sub: "텍스트 추출" },
  llm_refine: { name: "Gemini 정제", sub: "주장 구조화" },
  public_verify: {
    name: "공공 API 검증",
    sub: "전파인증 · 조달청 · TIPA · KORAIA",
  },
  patent_search: { name: "특허 · 인증 검색", sub: "KIPRIS · GS · NEP" },
  score: { name: "종합 분석", sub: "3차원 스코어 산정" },
};

export interface StageStatus {
  name: StageName;
  label: string;
  sub_label: string;
  state: StageState;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
}

export interface ProgressEvent {
  analysis_id: string;
  status: JobStatus;
  overall_percent: number;
  current_stage: StageName | null;
  stages: StageStatus[];
  updated_at: string;
}

export interface ProductInfo {
  name: string;
  manufacturer: string;
  source: ProductSource;
  category: string;
  icon: string;
  tags: string[];
  ai_claims_count: number;
  analysis_duration_seconds: number;
  analysis_date: string; // YYYY-MM-DD
}

export interface Scores {
  overall: number;
  overall_label: OverallLabel;
  text_credibility: number;
  verification_credibility: number;
  relational_credibility: number;
}

export interface XaiFinding {
  rank: number;
  title: string;
  description: string;
  impact_percent: number;
  direction: XaiDirection;
  category: XaiCategory;
}

export interface VerificationRow {
  key: string;
  value: string;
  intent: VerificationIntent;
}

export interface VerificationResult {
  rows: VerificationRow[];
}

export interface AnalysisMeta {
  backend: AnalyzerBackendName;
  pipeline_version: string;
  model_version: string | null;
  notes: string | null;
}

export interface AnalysisResult {
  analysis_id: string;
  product: ProductInfo;
  scores: Scores;
  xai_findings: XaiFinding[];
  verification: VerificationResult;
  meta: AnalysisMeta;
  created_at: string;
}

export interface AnalysisRequest {
  url: string;
}

export interface AnalysisCreatedResponse {
  analysis_id: string;
  status: "queued";
  progress_url: string;
  stream_url: string;
  result_url: string;
}
