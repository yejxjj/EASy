"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { apiLogin, apiRegister } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { saveUser } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(
    searchParams.get("tab") === "register" ? "register" : "login"
  );

  return (
    <div className="login-page">
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(37,99,235,.06) 0%, transparent 65%),
            #f4f6fb;
          padding: 24px;
          font-family: 'Inter', -apple-system, sans-serif;
        }
        .login-card {
          width: 100%;
          max-width: 420px;
        }
        .login-logo {
          text-align: center;
          margin-bottom: 36px;
        }
        .login-logo-text {
          font-size: 22px;
          font-weight: 600;
          letter-spacing: .28em;
          text-transform: uppercase;
          color: #0e1120;
          text-decoration: none;
          display: inline-block;
        }
        .login-logo-sub {
          display: block;
          font-size: 12px;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: rgba(14,17,32,.35);
          margin-top: 6px;
        }
        .login-box {
          background: #fff;
          border: 1px solid rgba(14,17,32,.1);
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 32px rgba(14,17,32,.07);
        }
        .login-tabs {
          display: flex;
          background: #f4f6fb;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 28px;
          gap: 4px;
        }
        .login-tab {
          flex: 1;
          text-align: center;
          padding: 8px 0;
          font-size: 15px;
          font-weight: 400;
          color: rgba(14,17,32,.42);
          border-radius: 7px;
          cursor: pointer;
          border: none;
          background: transparent;
          transition: all .2s;
          letter-spacing: .01em;
        }
        .login-tab.active {
          background: #fff;
          color: #0e1120;
          box-shadow: 0 1px 4px rgba(14,17,32,.1);
          font-weight: 500;
        }
        .login-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }
        .login-label {
          font-size: 13px;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: rgba(14,17,32,.42);
          font-weight: 500;
        }
        .login-input {
          height: 44px;
          width: 100%;
          background: #f8f9fc;
          border: 1px solid rgba(14,17,32,.12);
          border-radius: 10px;
          padding: 0 14px;
          font-size: 15px;
          color: #0e1120;
          font-family: inherit;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
          box-sizing: border-box;
        }
        .login-input::placeholder { color: rgba(14,17,32,.28); }
        .login-input:focus {
          border-color: rgba(37,99,235,.4);
          box-shadow: 0 0 0 3px rgba(37,99,235,.08);
          background: #fff;
        }
        .login-submit {
          width: 100%;
          height: 44px;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: all .2s;
          margin-top: 8px;
          letter-spacing: .02em;
        }
        .login-submit:hover { background: #1d4ed8; }
        .login-submit:disabled { background: rgba(37,99,235,.35); cursor: not-allowed; }
        .login-error {
          background: rgba(220,38,38,.07);
          border: 1px solid rgba(220,38,38,.18);
          border-radius: 8px;
          color: #dc2626;
          font-size: 14px;
          padding: 10px 14px;
          margin-bottom: 12px;
          line-height: 1.5;
        }
        .login-divider {
          height: 1px;
          background: rgba(14,17,32,.08);
          margin: 28px 0 20px;
        }
        .login-badges {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .login-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: rgba(14,17,32,.35);
        }
        .login-badge-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(37,99,235,.5);
          flex-shrink: 0;
        }
        .login-back {
          display: block;
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
          color: rgba(14,17,32,.35);
          text-decoration: none;
          letter-spacing: .01em;
          transition: color .2s;
        }
        .login-back:hover { color: rgba(14,17,32,.65); }
      `}</style>

      <div className="login-card">
        <div className="login-logo">
          <Link href="/" className="login-logo-text">Fides</Link>
          <span className="login-logo-sub">AI Reliability Analysis</span>
        </div>

        <div className="login-box">
          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab ${tab === "login" ? "active" : ""}`}
              onClick={() => setTab("login")}
            >
              로그인
            </button>
            <button
              type="button"
              className={`login-tab ${tab === "register" ? "active" : ""}`}
              onClick={() => setTab("register")}
            >
              회원가입
            </button>
          </div>

          {tab === "login" ? (
            <LoginForm onSuccess={(d) => { saveUser(d); router.push("/"); }} />
          ) : (
            <RegisterForm onSuccess={(d) => { saveUser(d); router.push("/"); }} />
          )}

        </div>

        <Link href="/" className="login-back">← 홈으로 돌아가기</Link>
      </div>
    </div>
  );
}

function LoginForm({ onSuccess }: { onSuccess: (d: Awaited<ReturnType<typeof apiLogin>>) => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;
    if (!email || !password) { setError("이메일과 비밀번호를 입력해 주세요."); return; }
    setLoading(true);
    try { onSuccess(await apiLogin(email, password)); }
    catch (err) { setError(err instanceof Error ? err.message : "로그인에 실패했습니다."); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="login-field">
        <label className="login-label">이메일</label>
        <input name="email" type="email" placeholder="your@email.com"
          autoComplete="email" required className="login-input" />
      </div>
      <div className="login-field">
        <label className="login-label">비밀번호</label>
        <input name="password" type="password" placeholder="••••••••"
          autoComplete="current-password" required className="login-input" />
      </div>
      {error && <div className="login-error">{error}</div>}
      <button type="submit" disabled={loading} className="login-submit">
        {loading ? "로그인 중…" : "로그인 →"}
      </button>
    </form>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: (d: Awaited<ReturnType<typeof apiRegister>>) => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;
    const nickname = (fd.get("nickname") as string) ?? "";
    if (!email || !password) { setError("이메일과 비밀번호를 입력해 주세요."); return; }
    if (password.length < 6) { setError("비밀번호는 6자 이상이어야 합니다."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("올바른 이메일 형식을 입력해 주세요."); return; }
    setLoading(true);
    try { onSuccess(await apiRegister(email, password, nickname)); }
    catch (err) { setError(err instanceof Error ? err.message : "회원가입에 실패했습니다."); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="login-field">
        <label className="login-label">이메일</label>
        <input name="email" type="email" placeholder="your@email.com"
          autoComplete="email" required className="login-input" />
      </div>
      <div className="login-field">
        <label className="login-label">닉네임 (선택)</label>
        <input name="nickname" type="text" placeholder="홍길동"
          autoComplete="username" className="login-input" />
      </div>
      <div className="login-field">
        <label className="login-label">비밀번호</label>
        <input name="password" type="password" placeholder="6자 이상"
          autoComplete="new-password" required className="login-input" />
      </div>
      {error && <div className="login-error">{error}</div>}
      <button type="submit" disabled={loading} className="login-submit">
        {loading ? "가입 중…" : "가입하기 →"}
      </button>
    </form>
  );
}
