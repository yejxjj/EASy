import Link from "next/link";

import { Button } from "@/components/primitives/Button";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <p className="text-fg-subtle font-mono text-xs uppercase tracking-tight">
        404
      </p>
      <h1 className="text-fg text-3xl font-bold tracking-tight">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="text-fg-muted text-sm leading-relaxed">
        주소를 다시 확인하거나 홈으로 돌아가 다시 시도해 주세요.
      </p>
      <Button asChild variant="primary">
        <Link href="/">홈으로</Link>
      </Button>
    </section>
  );
}
