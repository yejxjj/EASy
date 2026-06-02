"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Link as LinkIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/primitives/Button";
import { startAnalysis } from "@/lib/api";
import { ApiError } from "@/lib/api/errors";

const formSchema = z.object({
  url: z
    .string()
    .min(1, "URL을 입력해 주세요.")
    .url("URL 형식이 올바르지 않습니다.")
    .refine(
      (u) => /^https?:\/\/(prod|www|m)\.danawa\.com\//i.test(u),
      "현재 다나와 상품 페이지(prod·www·m.danawa.com)만 지원합니다.",
    ),
});

type FormValues = z.infer<typeof formSchema>;

interface UrlInputFormProps {
  initialUrl?: string;
  /** Optional ref so external callers can prefill (e.g. sample picker). */
  prefillBus?: { url: string; nonce: number } | null;
}

export function UrlInputForm({ initialUrl, prefillBus }: UrlInputFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: initialUrl ?? "" },
    mode: "onSubmit",
  });

  // Allow other components (e.g. SampleAnalysisPreview) to prefill the input.
  useEffect(() => {
    if (prefillBus && prefillBus.url) {
      setValue("url", prefillBus.url, { shouldValidate: false });
      const el = document.getElementById("analyze-url");
      if (el instanceof HTMLInputElement) {
        el.focus();
        el.setSelectionRange(prefillBus.url.length, prefillBus.url.length);
      }
    }
  }, [prefillBus, setValue]);

  const onSubmit = async ({ url }: FormValues) => {
    setServerError(null);
    try {
      const token =
        typeof window !== "undefined"
          ? (localStorage.getItem("fides_token") ?? undefined)
          : undefined;
      const created = await startAnalysis(url, token);
      router.push(`/analysis/${created.analysis_id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError(
          "백엔드에 연결할 수 없습니다. uvicorn 서버가 실행 중인지 확인해 주세요.",
        );
      }
    }
  };

  const errorMessage = errors.url?.message ?? serverError;

  return (
    <form
      id="analyze"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="w-full max-w-2xl"
    >
      <div
        className={`bg-bg border-border focus-within:border-fg flex h-16 items-center gap-2 rounded-[var(--radius-input)] border p-2 transition-colors shadow-[var(--shadow-input)] ${
          errorMessage ? "border-danger" : ""
        }`}
      >
        <div className="text-fg-subtle hidden items-center gap-1.5 pl-3 sm:flex">
          <LinkIcon size={16} aria-hidden />
          <span className="font-mono text-xs uppercase tracking-tight">url</span>
        </div>
        <input
          id="analyze-url"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://prod.danawa.com/info/?pcode=…"
          aria-invalid={!!errorMessage}
          aria-describedby={errorMessage ? "url-error" : "url-hint"}
          className="text-fg placeholder:text-fg-dim h-12 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none disabled:opacity-50"
          disabled={isSubmitting}
          {...register("url")}
        />
        <Button
          type="submit"
          variant="cta"
          size="lg"
          disabled={isSubmitting}
          aria-label="분석 시작"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden />
              <span>분석 중…</span>
            </>
          ) : (
            <>
              <span>분석 시작</span>
              <ArrowRight size={16} aria-hidden />
            </>
          )}
        </Button>
      </div>
      {errorMessage ? (
        <p id="url-error" role="alert" className="text-danger mt-3 text-xs">
          {errorMessage}
        </p>
      ) : (
        <p id="url-hint" className="text-fg-subtle mt-3 text-xs">
          현재 다나와 상품 페이지(prod·www·m.danawa.com)만 지원합니다.
        </p>
      )}
    </form>
  );
}
