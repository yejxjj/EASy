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

export interface HistoryItem {
  id: number;
  url: string;
  product_name: string;
  company_name: string;
  verdict: string;
  accs_score: number;
  risk_level: string;
  created_at: string;
}

export interface WatchlistItem {
  id: number;
  url: string;
  product_name: string;
  added_at: string;
}

export interface CompareItem {
  id: number;
  product_name: string;
  company_name: string;
  accs_score: number;
  verdict: string;
  risk_level: string;
  created_at: string;
  text_credibility?: number;
  verification_credibility?: number;
  relational_credibility?: number;
}
