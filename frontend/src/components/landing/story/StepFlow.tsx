"use client";

import { animate, createTimeline, stagger } from "animejs";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/cn";

/**
 * 3단계 처리 흐름.
 *
 * 발표 자료의 화살표 도형을 옮긴 것이다. 다만 화살표를 CSS clip-path 로
 * 흉내 내는 대신 번호와 구분선으로 순서를 표현했다 — 화살표 도형은
 * 좁은 화면에서 글자를 잘라먹는다.
 *
 * 파이프라인이 실제로 돈다. 화면에 들어오면 단계마다 상단 괘선이 왼쪽에서
 * 오른쪽으로 차오르고, 다 차면 STEP 번호에 불이 들어온 뒤 항목이 하나씩
 * 체크되듯 점이 튄다. 셋이 끝나면 괘선 전체가 파랗게 이어져 "다 거쳤다"가
 * 눈에 남는다. 정지된 3단 도형으로는 순서가 있다는 사실만 전달되고 각
 * 단계가 무언가를 처리한다는 감각은 전달되지 않는다.
 *
 * 진입이 끝난 뒤 어느 단계에 마우스를 올리면 그 단계만 다시 돈다.
 *
 * 글자는 어느 상태에서도 흐려지지 않는다. 비활성 단계를 흐리면 화면의
 * 3분의 2가 항상 읽기 힘든 상태로 남는다. 상태는 괘선·번호 색·점으로만
 * 표시한다.
 */

export interface Step {
  title: string;
  items: string[];
}

/** 한 단계가 차오르고 항목을 훑는 데 걸리는 시간 */
const DWELL = 1150;

export function StepFlow({
  steps,
  className,
}: {
  steps: Step[];
  className?: string;
}) {
  const rootRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-card]"));
    const dotsOf = cards.map((card) =>
      Array.from(card.querySelectorAll<HTMLElement>("[data-dot]")),
    );

    /** 점이 한 번 튀었다 가라앉는다 — 항목이 처리됐다는 신호 */
    const tick = (dots: HTMLElement[]) =>
      animate(dots, {
        scale: [
          { from: 1, to: 2.2, duration: 190, ease: "out(3)" },
          { to: 1, duration: 430, ease: "inOut(2)" },
        ],
        delay: stagger(140),
      });

    let ready = false;
    const run = createTimeline({
      autoplay: false,
      onComplete: () => {
        ready = true;
      },
    });

    cards.forEach((card, i) => {
      const at = i * DWELL;
      const fill = card.querySelector<HTMLElement>("[data-fill]");
      if (fill) {
        run.add(
          fill,
          {
            scaleX: [0, 1],
            duration: 820,
            ease: "out(3)",
            onBegin: () => card.classList.add("is-on"),
          },
          at,
        );
      }
      run.add(
        dotsOf[i],
        {
          scale: [
            { from: 1, to: 2.2, duration: 190, ease: "out(3)" },
            { to: 1, duration: 430, ease: "inOut(2)" },
          ],
          delay: stagger(140),
        },
        at + 420,
      );
    });

    /* 진입이 끝난 뒤에만 손을 받는다. 차오르는 중에 끼어들면 두 애니메이션이
       같은 점을 놓고 다툰다. */
    const enter = cards.map((card, i) => {
      const fn = () => {
        if (ready) tick(dotsOf[i]);
      };
      card.addEventListener("pointerenter", fn);
      return () => card.removeEventListener("pointerenter", fn);
    });

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        run.play();
        io.disconnect();
      },
      { threshold: 0.3 },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      enter.forEach((off) => off());
      run.revert();
      cards.forEach((card) => card.classList.remove("is-on"));
    };
  }, []);

  return (
    <ol
      ref={rootRef}
      className={cn("grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-4", className)}
    >
      {steps.map((step, i) => (
        <li
          key={step.title}
          data-card
          className="step-card border-border relative border-t pt-5 md:pr-4"
        >
          {/* 괘선을 왼쪽부터 덮어 나간다 */}
          <span
            data-fill
            className="step-fill absolute -top-px left-0 h-[2px] w-full"
            style={{ background: "var(--color-brand-fg)" }}
            aria-hidden
          />
          <p className="step-num text-fg-faint font-mono text-xs tracking-[var(--tracking-label)]">
            STEP {String(i + 1).padStart(2, "0")}
          </p>
          <h3 className="text-fg mt-2 text-[17px] font-medium tracking-[var(--tracking-tight)]">
            {step.title}
          </h3>
          <ul className="mt-3.5 flex flex-col gap-2">
            {step.items.map((item) => (
              <li key={item} className="text-fg-dim flex gap-2 text-xs leading-relaxed">
                <span
                  data-dot
                  aria-hidden
                  className="mt-[7px] size-1 shrink-0 rounded-full"
                  style={{ background: "var(--color-brand-fg)" }}
                />
                {item}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
