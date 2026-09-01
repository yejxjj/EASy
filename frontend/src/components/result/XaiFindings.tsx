"use client";

import { useMemo, useState } from "react";

import { Card } from "@/components/primitives/Card";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/primitives/Tabs";
import { XaiFindingItem } from "@/components/result/XaiFindingItem";
import type { XaiCategory, XaiFinding } from "@/types/analysis";

type TabKey = "all" | XaiCategory;

/* 탭 이름도 세 축과 같은 말을 쓴다. "관계형"은 이 서비스 어디에서도
   설명하지 않는 단어였다 — 실제로 보는 건 기관에 남은 활동 이력이다. */
const TAB_LABELS: Record<TabKey, string> = {
  all: "전체",
  washing: "AI 워싱",
  verification: "공인 인증",
  relational: "기관 이력",
};

interface XaiFindingsProps {
  findings: XaiFinding[];
}

export function XaiFindings({ findings }: XaiFindingsProps) {
  const byCategory = useMemo(() => {
    const buckets: Record<TabKey, XaiFinding[]> = {
      all: [...findings].sort((a, b) => a.rank - b.rank),
      washing: [],
      verification: [],
      relational: [],
    };
    for (const f of findings) {
      buckets[f.category].push(f);
    }
    for (const k of ["washing", "verification", "relational"] as XaiCategory[]) {
      buckets[k].sort((a, b) => a.rank - b.rank);
    }
    return buckets;
  }, [findings]);

  const [tab, setTab] = useState<TabKey>("all");

  return (
    <Card>
      <SectionHeader
        eyebrow="xai"
        title="핵심 판단 근거"
        count={findings.length}
        aside={<span>위험도에 미친 영향 순으로 정렬</span>}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="border-border border-b px-5">
          <TabsList>
            {(Object.keys(TAB_LABELS) as TabKey[]).map((k) => (
              <TabsTrigger key={k} value={k}>
                <span>{TAB_LABELS[k]}</span>
                <span className="text-fg-dim ml-1.5 font-mono text-[13px]">
                  {byCategory[k].length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {(Object.keys(TAB_LABELS) as TabKey[]).map((k) => (
          <TabsContent key={k} value={k}>
            {byCategory[k].length === 0 ? (
              <p className="text-fg-subtle py-8 text-center text-sm">
                해당 카테고리의 근거가 없습니다.
              </p>
            ) : (
              <ol className="divide-soft">
                {byCategory[k].map((f) => (
                  <XaiFindingItem key={`${f.category}-${f.rank}`} finding={f} />
                ))}
              </ol>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}
