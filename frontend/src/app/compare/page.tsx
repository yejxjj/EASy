"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { CompareView } from "@/components/compare/CompareView";
import { Button } from "@/components/primitives/Button";
import { apiCompare } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth";
import type { CompareItem } from "@/types/auth";

/**
 * 제품 비교 — 데이터만 가져온다.
 *
 * 조판은 `CompareView` 에 있다. 이 화면은 로그인과 기록 2건이 있어야
 * 열려서 개발 중에 눈으로 확인할 길이 없었다. 그래서 결과 화면과 같은
 * 방식으로 갈라 두었다 — `/preview/compare` 가 같은 컴포넌트를 표본으로
 * 띄운다.
 */

export default function ComparePage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <CompareContent />
    </Suspense>
  );
}

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, mounted } = useAuth();

  const [items, setItems] = useState<CompareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!mounted) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    const raw = searchParams.get("ids") ?? "";
    const ids = raw.split(",").map(Number).filter(Boolean);
    if (ids.length < 2) {
      router.replace("/dashboard");
      return;
    }

    apiCompare(user.token, ids)
      .then((d) => setItems(d.items))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "불러오지 못했습니다."),
      )
      .finally(() => setLoading(false));
  }, [mounted, user, router, searchParams]);

  if (!mounted || loading) return <Skeleton />;

  if (error) {
    return <Notice message={error} />;
  }

  /* 서버가 남의 기록이나 지워진 id 를 걸러내면 한 건만 남을 수 있다.
     그러면 비교할 게 없으므로 표를 그리지 않는다. */
  if (items.length < 2) {
    return (
      <Notice message="비교할 기록을 찾지 못했습니다. 두 건 이상 선택해 주세요." />
    );
  }

  return <CompareView items={items} />;
}

function Notice({ message }: { message: string }) {
  return (
    <div className="bg-bg flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-14 md:px-10">
        <p
          className="border-t pt-4 text-sm leading-loose"
          style={{
            borderColor: "var(--color-missing)",
            color: "var(--color-missing)",
          }}
        >
          {message}
        </p>
        <Button asChild variant="secondary" size="sm" className="mt-6">
          <Link href="/dashboard">대시보드로</Link>
        </Button>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="bg-bg flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-14 md:px-10">
        <div className="bg-surface h-3 w-16 animate-pulse rounded" />
        <div className="bg-surface mt-3 h-7 w-32 animate-pulse rounded" />
        <div className="bg-surface mt-8 h-4 w-full max-w-[52ch] animate-pulse rounded" />
        <div className="border-border mt-12 border-t">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="border-border flex gap-4 border-b py-5"
              aria-hidden
            >
              <div className="bg-surface h-4 w-1/5 animate-pulse rounded" />
              <div className="bg-surface h-4 flex-1 animate-pulse rounded" />
              <div className="bg-surface h-4 flex-1 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
