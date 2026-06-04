"use client";

import { useCallback, useEffect, useState } from "react";

import type { AuthUser, LoginResponse } from "@/types/auth";

const KEYS = {
  token:    "fides_token",
  email:    "fides_email",
  nickname: "fides_nickname",
} as const;

/** 같은 탭 내 모든 useAuth 인스턴스에 변경을 알리는 커스텀 이벤트 */
const AUTH_EVENT = "fides-auth-change";

/** Read token without a hook — safe to call outside React (e.g. fetch helpers). */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.token);
}

function readFromStorage(): AuthUser | null {
  const token    = localStorage.getItem(KEYS.token);
  const email    = localStorage.getItem(KEYS.email);
  const nickname = localStorage.getItem(KEYS.nickname);
  if (token && email) {
    return { token, email, nickname: nickname ?? email.split("@")[0] };
  }
  return null;
}

export function useAuth() {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 최초 마운트 시 localStorage 읽기
    setUser(readFromStorage());
    setMounted(true);

    // 같은 탭 내 다른 컴포넌트(로그인 페이지 등)가 saveUser/logout 호출 시 동기화
    function onAuthChange() {
      setUser(readFromStorage());
    }
    window.addEventListener(AUTH_EVENT, onAuthChange);
    return () => window.removeEventListener(AUTH_EVENT, onAuthChange);
  }, []);

  const saveUser = useCallback((data: LoginResponse) => {
    const nickname = data.nickname || data.email.split("@")[0];
    localStorage.setItem(KEYS.token,    data.token);
    localStorage.setItem(KEYS.email,    data.email);
    localStorage.setItem(KEYS.nickname, nickname);
    setUser({ token: data.token, email: data.email, nickname });
    // 레이아웃에 마운트된 AuthNav 등 모든 인스턴스에 알림
    window.dispatchEvent(new Event(AUTH_EVENT));
  }, []);

  const logout = useCallback(() => {
    (Object.values(KEYS) as string[]).forEach((k) => localStorage.removeItem(k));
    setUser(null);
    window.dispatchEvent(new Event(AUTH_EVENT));
  }, []);

  return { user, mounted, saveUser, logout };
}
