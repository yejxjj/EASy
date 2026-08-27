import type { Claim } from "@/types/analysis";

export interface AuthUser {
  email: string;
  nickname: string;
  token: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  nickname: string;
}

/**
 * 주장 집계.
 *
 * `total` 이 0 이면 이 분석에는 주장별 자료가 없다 — 서버가
 * capability_scores 를 저장하기 전에 만들어진 기록이다. 그때는 격자를
 * 그리지 않는다.
 */
export interface ClaimRollup {
  total: number;
  verified: number;
  partial: number;
  missing: number;
}

export interface HistoryItem {
  id: number;
  url: string;
  product_name: string;
  company_name: string;
  verdict: string;
  accs_score: number;
  risk_level: string;
  created_at: string;
  /** 온톨로지 매핑 카테고리 (예: 세탁기, 로봇 청소기). result_json 에서 뽑는다 */
  category: string;
  claims?: ClaimRollup;
}

export interface WatchlistItem {
  id: number;
  url: string;
  product_name: string;
  added_at: string;
}

/**
 * `GET /api/dashboard` 응답.
 *
 * 서버가 이미 계산해 주고 있는데 프론트가 한 번도 부른 적이 없었다.
 * 요약 통계와 회사별 집계는 `/api/history` 를 아무리 훑어도 못 만드는
 * 값이므로(전체 건수는 목록 길이와 다르다) 이쪽을 쓴다.
 */
export interface DashboardSummary {
  total: number;
  avg_score: number | null;
  /** accs_score >= 60 */
  ok_count: number;
  /** 35 <= accs_score < 60 */
  warn_count: number;
  /** accs_score < 35 */
  danger_count: number;
}

export interface CompanyRollup {
  company_name: string;
  count: number;
  avg_score: number;
  min_score: number;
  max_score: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  by_company: CompanyRollup[];
  recent: (Omit<HistoryItem, "category"> & { created_at: string })[];
}

export interface CompareItem {
  id: number;
  product_name: string;
  company_name: string;
  accs_score: number;
  verdict: string;
  risk_level: string;
  /** 서버가 이미 `YYYY.MM.DD` 로 만들어 보낸다 */
  created_at: string;
  category?: string;
  text_credibility?: number;
  verification_credibility?: number;
  relational_credibility?: number;
  /** 이 분석 이전 기록에는 없다. 빈 배열이면 화면이 주장 대조를 접는다. */
  claims?: Claim[];
  claims_rollup?: ClaimRollup;
}
