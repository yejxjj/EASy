import type { AnalysisResult } from "@/types/analysis";
import type {
  CompareItem,
  DashboardData,
  HistoryItem,
  LoginResponse,
  WatchlistItem,
} from "@/types/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

async function authPost<T>(endpoint: string, body: object): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { detail?: string }).detail ?? `요청 실패 (${res.status})`,
    );
  }
  return res.json() as Promise<T>;
}

export const apiLogin = (email: string, password: string) =>
  authPost<LoginResponse>("/api/auth/login", { email, password });

export const apiRegister = (
  email: string,
  password: string,
  nickname: string,
) => authPost<LoginResponse>("/api/auth/register", { email, password, nickname });

/**
 * 요약 통계 · 회사별 집계 · 최근 5건.
 *
 * `/api/history` 로는 못 만드는 값이 들어 있다 — 전체 건수와 평균은 목록을
 * 아무리 훑어도 안 나온다(목록이 잘려 올 수 있으므로).
 */
export async function apiFetchDashboard(token: string): Promise<DashboardData> {
  const res = await fetch(`${API_BASE}/api/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("대시보드를 불러오지 못했습니다.");
  return res.json() as Promise<DashboardData>;
}

export async function apiFetchHistory(token: string): Promise<HistoryItem[]> {
  const res = await fetch(`${API_BASE}/api/history`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("히스토리를 불러오지 못했습니다.");
  return res.json() as Promise<HistoryItem[]>;
}

export async function apiDeleteHistory(
  token: string,
  id: number,
): Promise<void> {
  await fetch(`${API_BASE}/api/history/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiFetchWatchlist(token: string): Promise<WatchlistItem[]> {
  const res = await fetch(`${API_BASE}/api/watchlist`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("북마크를 불러오지 못했습니다.");
  return res.json() as Promise<WatchlistItem[]>;
}

export async function apiAddWatchlist(
  token: string,
  url: string,
  product_name: string,
): Promise<WatchlistItem> {
  const res = await fetch(`${API_BASE}/api/watchlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ url, product_name }),
  });
  if (!res.ok) throw new Error("북마크 추가에 실패했습니다.");
  return res.json() as Promise<WatchlistItem>;
}

export async function apiDeleteWatchlist(token: string, id: number): Promise<void> {
  await fetch(`${API_BASE}/api/watchlist/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiFetchHistoryResult(
  token: string,
  id: number,
): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/api/history/${id}/result`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("분석 결과를 불러오지 못했습니다.");
  return res.json() as Promise<AnalysisResult>;
}

export async function apiCompare(
  token: string,
  ids: number[],
): Promise<{ items: CompareItem[] }> {
  const res = await fetch(`${API_BASE}/api/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error("비교 데이터를 불러오지 못했습니다.");
  return res.json() as Promise<{ items: CompareItem[] }>;
}
