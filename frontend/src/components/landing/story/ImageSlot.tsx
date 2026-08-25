"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

/**
 * 사진이 들어갈 자리.
 *
 * 지금 리포에는 랜딩에 쓸 사진이 없다. `product_images/` 의 것은 상품
 * 상세페이지를 긁은 타사 저작물이고 실명 브랜드가 그대로 찍혀 있어,
 * AI 워싱을 지적하는 화면에 붙일 수 없다.
 *
 * 그래서 구도만 먼저 세우고 자리를 비워 둔다. `public/` 아래 같은 경로에
 * 파일을 넣으면 그대로 붙고, 없으면 비율과 찍을 대상을 적은 판이 대신
 * 자리를 지킨다. 레이아웃은 사진 유무와 무관하게 완성된 상태로 검토할 수
 * 있어야 한다 — 빈 칸이 무너지면 구도를 못 고른다.
 */
export function ImageSlot({
  src,
  ratio,
  subject,
  className,
  overlay,
}: {
  /** public 기준 경로. 예: /evidence/archive.jpg */
  src: string;
  /** aspect-ratio 값. 예: "16 / 6" */
  ratio: string;
  /** 무엇을 찍거나 구해야 하는가 */
  subject: string;
  className?: string;
  /** 사진 위에 글자를 얹는 자리 */
  overlay?: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  /* onError 만으로는 놓친다. 서버가 그린 <img> 는 React 가 하이드레이션하며
     핸들러를 붙이기 전에 이미 실패해 있고, 그 이벤트는 되살아나지 않는다.
     마운트 시점에 한 번 직접 확인한다. */
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-tile)] bg-white/[0.03]",
        className,
      )}
      style={{ aspectRatio: ratio }}
    >
      {failed ? (
        <div
          className="absolute inset-0 grid place-items-center p-5 text-center"
          style={{
            background:
              "repeating-linear-gradient(135deg, rgba(255,255,255,.04) 0 7px, transparent 7px 14px)",
          }}
        >
          <div>
            <p className="font-mono text-[10px] tracking-[var(--tracking-label)] text-white/35">
              IMAGE · {ratio.replace(/\s/g, "")}
            </p>
            <p className="mt-2 max-w-[260px] text-xs leading-relaxed text-white/60">
              {subject}
            </p>
            <p className="mt-2.5 font-mono text-[10px] text-white/25">{src}</p>
          </div>
        </div>
      ) : (
        /* next/image 를 쓰지 않는다 — 파일이 없을 때 빌드가 아니라 화면에서
           조용히 대체돼야 구도를 검토할 수 있다. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={src}
          alt=""
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {overlay}
    </div>
  );
}
