import { clearStoredAuth } from "@/lib/auth";
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

/**
 * 세션이 끝났다. 호출한 쪽은 이걸 잡아 로그인으로 보내면 된다.
 *
 * 일반 실패와 구분해야 한다 — 네트워크가 끊긴 것과 토큰이 만료된 것은
 * 사용자가 할 일이 다르다(기다린다 / 다시 로그인한다).
 */
export class SessionExpiredError extends Error {
  constructor() {
    super("로그인이 만료됐습니다. 다시 로그인해 주세요.");
    this.name = "SessionExpiredError";
  }
}

export function isSessionExpired(e: unknown): e is SessionExpiredError {
  return e instanceof SessionExpiredError;
}

/**
 * 토큰이 필요한 요청 한 벌.
 *
 * 401 이면 저장된 세션을 그 자리에서 지운다. 만료된 토큰을 들고 계속
 * 두드려 봐야 같은 답만 오고, 화면은 로그인한 것처럼 보이면서 아무것도
 * 안 되는 상태에 갇힌다.
 */
async function authFetch(
  endpoint: string,
  token: string,
  init: RequestInit = {},
  failMessage = "요청에 실패했습니다.",
): Promise<Response> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (res.status === 401) {
    clearStoredAuth();
    throw new SessionExpiredError();
  }
  if (!res.ok) throw new Error(failMessage);
  return res;
}

async function authGet<T>(
  endpoint: string,
  token: string,
  failMessage: string,
): Promise<T> {
  const res = await authFetch(endpoint, token, {}, failMessage);
  return res.json() as Promise<T>;
}

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
export const apiFetchDashboard = (token: string) =>
  authGet<DashboardData>(
    "/api/dashboard",
    token,
    "대시보드를 불러오지 못했습니다.",
  );

export const apiFetchHistory = (token: string) =>
  authGet<HistoryItem[]>(
    "/api/history",
    token,
    "히스토리를 불러오지 못했습니다.",
  );

export const apiFetchWatchlist = (token: string) =>
  authGet<WatchlistItem[]>(
    "/api/watchlist",
    token,
    "북마크를 불러오지 못했습니다.",
  );

export const apiFetchHistoryResult = (token: string, id: number) =>
  authGet<AnalysisResult>(
    `/api/history/${id}/result`,
    token,
    "분석 결과를 불러오지 못했습니다.",
  );

/* 삭제는 응답을 확인한다. 예전에는 fetch 결과를 그냥 버려서 서버가
   거절해도 화면에서는 지워진 것처럼 보였다. */
export async function apiDeleteHistory(
  token: string,
  id: number,
): Promise<void> {
  await authFetch(
    `/api/history/${id}`,
    token,
    { method: "DELETE" },
    "삭제에 실패했습니다.",
  );
}

export async function apiDeleteWatchlist(
  token: string,
  id: number,
): Promise<void> {
  await authFetch(
    `/api/watchlist/${id}`,
    token,
    { method: "DELETE" },
    "북마크 삭제에 실패했습니다.",
  );
}

export async function apiAddWatchlist(
  token: string,
  url: string,
  product_name: string,
): Promise<WatchlistItem> {
  const res = await authFetch(
    "/api/watchlist",
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, product_name }),
    },
    "북마크 추가에 실패했습니다.",
  );
  return res.json() as Promise<WatchlistItem>;
}

export async function apiCompare(
  token: string,
  ids: number[],
): Promise<{ items: CompareItem[] }> {
  const res = await authFetch(
    "/api/compare",
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    },
    "비교 데이터를 불러오지 못했습니다.",
  );
  return res.json() as Promise<{ items: CompareItem[] }>;
}
