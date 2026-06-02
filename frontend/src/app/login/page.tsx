"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/primitives/Tabs";
import { apiLogin, apiRegister } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";

/* ── useSearchParams()는 Suspense 경계 안쪽에서만 허용 ── */
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

  const defaultTab = searchParams.get("tab") === "register" ? "register" : "login";

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">

        {/* 로고 */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <span className="fides-wordmark text-4xl font-extrabold tracking-tight">
              Fides
            </span>
          </Link>
          <p className="mono-eyebrow mt-2">AI Washing Detection</p>
        </div>

        <Card className="p-6">
          <Tabs defaultValue={defaultTab}>
            <TabsList className="mb-6 w-full">
              <TabsTrigger value="login"    className="flex-1">로그인</TabsTrigger>
              <TabsTrigger value="register" className="flex-1">회원가입</TabsTrigger>
            </TabsList>

            {/* ── 로그인 ── */}
            <TabsContent value="login">
              <LoginForm
                onSuccess={(data) => { saveUser(data); router.push("/"); }}
              />
            </TabsContent>

            {/* ── 회원가입 ── */}
            <TabsContent value="register">
              <RegisterForm
                onSuccess={(data) => { saveUser(data); router.push("/"); }}
              />
            </TabsContent>
          </Tabs>
        </Card>

        {/* 보안 배지 */}
        <div className="mt-6 flex justify-center gap-5 flex-wrap">
          {["bcrypt 암호화", "JWT 인증", "30일 세션"].map((s) => (
            <span key={s} className="mono-eyebrow flex items-center gap-1.5">
              <span className="bg-brand h-1.5 w-1.5 rounded-full inline-block" />
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────── 로그인 폼 ── */
function LoginForm({ onSuccess }: { onSuccess: (d: Awaited<ReturnType<typeof apiLogin>>) => void }) {
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd       = new FormData(e.currentTarget);
    const email    = fd.get("email")    as string;
    const password = fd.get("password") as string;
    if (!email || !password) { setError("이메일과 비밀번호를 입력해 주세요."); return; }

    setLoading(true);
    try {
      onSuccess(await apiLogin(email, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="이메일">
        <input name="email" type="email" placeholder="your@email.com"
          autoComplete="email" required className={inputCls} />
      </Field>
      <Field label="비밀번호">
        <input name="password" type="password" placeholder="••••••••"
          autoComplete="current-password" required className={inputCls} />
      </Field>
      {error && <ErrMsg>{error}</ErrMsg>}
      <Button type="submit" variant="cta" size="lg"
        disabled={loading} className="mt-1 w-full">
        {loading ? "로그인 중…" : "로그인"}
      </Button>
    </form>
  );
}

/* ────────────────────────────────── 회원가입 폼 ── */
function RegisterForm({ onSuccess }: { onSuccess: (d: Awaited<ReturnType<typeof apiRegister>>) => void }) {
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd       = new FormData(e.currentTarget);
    const email    = fd.get("email")    as string;
    const password = fd.get("password") as string;
    const nickname = (fd.get("nickname") as string) ?? "";
    if (!email || !password) { setError("이메일과 비밀번호를 입력해 주세요."); return; }
    if (password.length < 6) { setError("비밀번호는 6자 이상이어야 합니다."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("올바른 이메일 형식을 입력해 주세요."); return;
    }

    setLoading(true);
    try {
      onSuccess(await apiRegister(email, password, nickname));
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="이메일">
        <input name="email" type="email" placeholder="your@email.com"
          autoComplete="email" required className={inputCls} />
      </Field>
      <Field label="닉네임 (선택)">
        <input name="nickname" type="text" placeholder="홍길동"
          autoComplete="username" className={inputCls} />
      </Field>
      <Field label="비밀번호">
        <input name="password" type="password" placeholder="6자 이상"
          autoComplete="new-password" required className={inputCls} />
      </Field>
      {error && <ErrMsg>{error}</ErrMsg>}
      <Button type="submit" variant="cta" size="lg"
        disabled={loading} className="mt-1 w-full">
        {loading ? "가입 중…" : "가입하기"}
      </Button>
    </form>
  );
}

/* ── 공용 서브컴포넌트 ── */
const inputCls = cn(
  "bg-surface border-border h-11 w-full rounded-[var(--radius-input)] border px-4",
  "text-sm text-fg placeholder:text-fg-dim outline-none transition-colors",
  "focus:border-brand/60 focus:ring-2 focus:ring-brand/15",
);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="mono-eyebrow">{label}</label>
      {children}
    </div>
  );
}

function ErrMsg({ children }: { children: React.ReactNode }) {
  return (
    <p className="bg-danger-soft text-danger rounded-xl px-3 py-2 text-xs">
      {children}
    </p>
  );
}
