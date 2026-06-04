"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/primitives/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/primitives/Card";

export default function AnalysisError({ error }: { error: Error }) {
  return (
    <section className="mx-auto max-w-2xl px-6 py-20">
      <Card>
        <CardHeader>
          <div className="text-danger flex items-center gap-2">
            <AlertTriangle size={18} aria-hidden />
            <CardTitle className="text-danger">
              페이지 렌더링 중 문제가 발생했습니다
            </CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-fg-muted text-sm leading-relaxed">
            {error.message || "알 수 없는 오류가 발생했습니다."}
          </p>
          <div className="mt-6">
            <Button asChild variant="primary">
              <Link href="/">
                <RotateCcw size={16} aria-hidden />
                홈으로 돌아가기
              </Link>
            </Button>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
