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
  llm_refine: { name: "로컬 AI 정제 중", sub: "Ollama · 주장 구조화" },
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
  ecs: number;
  conf: number;
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

/* ── 대조 뷰 (Claim–Evidence) ──────────────────────────────────────────────
   주장 하나와 그에 대응하는 공공 기록의 연결 상태.

   백엔드 `analysis_engine.CapabilityScore` 가 이미 전부 계산하고 있으나
   `server.py` 직렬화 단계에서 버려진다. 4단계에서 아래 형태로 내보낸다:

     text     ← capability_name_ko
     quote    ← matched_strong_patterns[0]
     evidence ← supporting_sources
     note     ← missing_required_components
     status   ← supporting_sources / required_fulfillment_ratio 로 판정      */

export type ClaimStatus = "verified" | "partial" | "unsupported";

export interface EvidenceRef {
  /** 근거를 찾은 기관. "KIPRIS" · "DART" · "KC" 등 */
  source: string;
  /** 화면에 그대로 노출되는 한 줄 설명 */
  label: string;
  record_id: string | null;
}

export interface Claim {
  id: string;
  /** 제품이 내세운 기능 이름 */
  text: string;
  /** 페이지에서 실제로 매칭된 광고 문구 */
  quote: string | null;
  status: ClaimStatus;
  /** 빈 배열이면 근거 없음 */
  evidence: EvidenceRef[];
  /** 연결이 끊긴 이유 — "KIPRIS 0건 · DART 0건" 등 */
  note: string | null;
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
  /** 4단계에서 백엔드가 채운다. 그전까지는 undefined. */
  claims?: Claim[];
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
