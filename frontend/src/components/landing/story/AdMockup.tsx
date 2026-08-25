"use client";

import { animate, createAnimatable, createTimeline, stagger } from "animejs";
import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * 광고 문구가 붙어 있던 제품을 3D 로 세운 목업.
 *
 * 이전에는 인용문 세 개를 나란히 적기만 했다. 문장은 맞았지만 화면이
 * 글자로만 채워져, "지금 팔리는 제품에 적혀 있다"는 말이 눈으로 확인되지
 * 않았다. 그래서 문구마다 그 문구가 실제로 붙은 물건 — 세탁기, 리모컨,
 * 냉장고 — 을 세우고 그 아래에 문구를 붙였다.
 *
 * 제품은 사진이 아니라 선으로 그린 부피다. 면은 거의 비어 있고 모서리만
 * 남긴다. 특정 브랜드의 제품처럼 보이면 안 되고(문구도 브랜드를 지운
 * 인용이다), 이 서비스가 하는 일이 광고 이미지가 아니라 제품의 구조를
 * 뜯어보는 쪽이기 때문이다.
 *
 * 움직임은 셋으로 나뉜다:
 *   1. 진입   세 칸이 깊이에서 차례로 떠오른다
 *   2. 상시   각 제품이 서로 다른 주기로 흔들린다 — 드럼이 돌고, AI 버튼이
 *             맥동하고, 냉기 선이 흐른다. 광고가 약속하는 "지능"이다
 *   3. 반복   검증선이 제품을 하나씩 훑고, 훑은 자리마다 `근거 미확인` 이
 *             깜빡인다. 이 서비스가 실제로 하는 일의 예고편이다
 *
 * 문구의 조판은 이전과 같다. 상자를 씌우지 않고 상단 괘선과 타이포로만
 * 나눈다. 입체감은 카드 껍데기가 아니라 깊이와 시차에서 나온다.
 *
 * 좁은 화면(< lg)에서는 원근을 끄고 평행 투영으로 남긴다 — 제품은 도면처럼
 * 그대로 보이고, 세 칸은 예전과 같은 목록이 된다. 배치는 전부 globals.css 의
 * `.claim-*` 규칙에 있고 여기서는 transform 만 다룬다. 둘을 섞으면 anime 가
 * 쓴 인라인 transform 과 스타일시트가 서로를 덮는다.
 */

export type AdProduct = "washer" | "remote" | "fridge";

export interface AdQuote {
  headline: string;
  body: string;
  /** 문구가 붙어 있던 물건. 목업의 형상을 정한다. */
  product: AdProduct;
}

/** 앞으로 나온 정도(px). 가운데가 가장 앞이라 시선이 먼저 붙는다. */
const DEPTH = [0, 74, 0];
/** 좌우 끝은 안쪽으로 접어 호를 만든다. 칸 사이가 멀어 각을 크게 주면 휜다. */
const YAW = [10, 0, -10];
/** 상시 흔들림의 주기. 서로 어긋나야 셋이 한 몸처럼 움직이지 않는다. */
const SWAY = [5200, 6100, 4700];
/** 검증선이 한 제품을 훑고 다음으로 넘어가는 간격 */
const STEP = 950;
const REST = 900;

/** 마우스를 떼었을 때 돌아갈 기울기. 정면보다 살짝 틀어야 입체가 읽힌다. */
const REST_TILT = { x: 3, y: -5 };

/* ══ 부피 ════════════════════════════════════════════════════════════ */

/**
 * 면의 밝기는 광원 방향을 따른다. 페이지 전체가 좌상단 광원을 전제로
 * 하므로(ChromeObject 와 같은 규칙) 윗면이 가장 밝고, 왼쪽 면이 앞면보다
 * 조금 밝고, 오른쪽 면이 가장 어둡다.
 *
 * 이전에는 세 면의 채움이 0.045 / 0.03 / 0.015 로 거의 붙어 있어 부피가
 * 읽히지 않았다. 면마다 단색이 아니라 옅은 그라데이션을 깔아 한 면 안에서도
 * 위아래 밝기가 달라지게 한다 — 평평한 색은 종이처럼 보인다.
 */
const FACE_TONE = {
  front: {
    border: "border-white/28",
    background:
      "linear-gradient(157deg, rgba(255,255,255,.085) 0%, rgba(255,255,255,.028) 52%, rgba(255,255,255,.05) 100%)",
    /* 윗모서리 하이라이트 — globals.css 의 `.surface-lift` 와 같은 규칙 */
    shadow: "inset 0 1px 0 rgba(255,255,255,.17)",
  },
  left: {
    border: "border-white/20",
    background:
      "linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.016))",
    shadow: "inset 0 1px 0 rgba(255,255,255,.12)",
  },
  right: {
    border: "border-white/11",
    background:
      "linear-gradient(180deg, rgba(255,255,255,.024), rgba(255,255,255,.005))",
    shadow: "none",
  },
  top: {
    border: "border-white/26",
    background:
      "linear-gradient(180deg, rgba(255,255,255,.125), rgba(255,255,255,.04))",
    shadow: "none",
  },
} as const;

/** 면 하나. 부모의 한가운데를 원점으로 삼는다. */
function Face({
  w,
  h,
  transform,
  tone = "front",
  radius = 3,
  children,
}: {
  w: number;
  h: number;
  transform: string;
  tone?: keyof typeof FACE_TONE;
  radius?: number;
  children?: ReactNode;
}) {
  const t = FACE_TONE[tone];
  return (
    <div
      className={cn("absolute top-1/2 left-1/2 overflow-hidden border", t.border)}
      style={{
        width: w,
        height: h,
        marginLeft: -w / 2,
        marginTop: -h / 2,
        borderRadius: radius,
        background: t.background,
        boxShadow: t.shadow,
        transform,
        backfaceVisibility: "hidden",
      }}
    >
      {children}
    </div>
  );
}

/**
 * 앞·좌·우·윗면만 만든다. 뒷면과 바닥은 어느 각도에서도 보이지 않고,
 * 보일 뻔한 면은 backface-visibility 가 알아서 지운다.
 */
function Volume({
  w,
  h,
  d,
  radius = 3,
  children,
}: {
  w: number;
  h: number;
  d: number;
  radius?: number;
  children?: ReactNode;
}) {
  /* 옆면까지 같은 반지름을 주면, 두께가 얇은 물건(리모컨)에서 옆면이
     알약처럼 둥글어져 본체와 떨어진 별개의 판으로 읽힌다. */
  const sideRadius = Math.min(radius, Math.round(d / 4));

  return (
    <>
      <Face
        w={d}
        h={h}
        radius={sideRadius}
        tone="left"
        transform={`rotateY(-90deg) translateZ(${w / 2}px)`}
      />
      <Face
        w={d}
        h={h}
        radius={sideRadius}
        tone="right"
        transform={`rotateY(90deg) translateZ(${w / 2}px)`}
      />
      <Face
        w={w}
        h={d}
        radius={sideRadius}
        tone="top"
        transform={`rotateX(90deg) translateZ(${h / 2}px)`}
      />
      <Face w={w} h={h} radius={radius} transform={`translateZ(${d / 2}px)`}>
        {children}
      </Face>

      {/* 접지 — 바닥에 깔린 옅은 빛 웅덩이.
          검은 배경에서는 그림자를 드리울 수 없으므로 반대로 간다. 이게
          없으면 물건이 허공에 떠 있어 아무리 면을 다듬어도 값싸 보인다. */}
      <span
        aria-hidden
        className="absolute top-1/2 left-1/2 rounded-[50%]"
        style={{
          width: w * 1.7,
          height: 24,
          marginLeft: (-w * 1.7) / 2,
          marginTop: h / 2 - 11,
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,.11), rgba(255,255,255,0) 68%)",
          filter: "blur(3px)",
        }}
      />
    </>
  );
}

/* ══ 제품 ════════════════════════════════════════════════════════════ */

/** 드럼 세탁기 — "인공지능 DD". 문 안쪽 드럼이 계속 돈다. */
function Washer() {
  return (
    <Volume w={94} h={106} d={72}>
      <div className="flex h-[19px] items-center gap-1 border-b border-white/14 px-2">
        <span className="size-[3px] rounded-full bg-white/45" />
        <span className="size-[3px] rounded-full bg-white/22" />
        <span
          className="ml-auto h-[3px] w-5 rounded-full"
          style={{ background: "var(--color-brand)", opacity: 0.75 }}
        />
      </div>
      {/* 도어 — 지름을 가로지르는 선 대신 림 안쪽에 짧은 리프터를 둔다.
          지름선 셋은 드럼이 아니라 파이 차트로 읽힌다. */}
      <div
        className="relative mx-auto mt-[9px] size-[62px] rounded-full border border-white/34"
        style={{
          background:
            "radial-gradient(circle at 34% 26%, rgba(255,255,255,.11), rgba(255,255,255,.012) 64%)",
        }}
      >
        <div className="absolute inset-[5px] rounded-full border border-white/13" />
        <div data-spin className="absolute inset-0">
          {[0, 120, 240].map((deg) => (
            <span
              key={deg}
              className="absolute top-1/2 left-1/2 rounded-[1px] bg-white/22"
              style={{
                width: 3,
                height: 8,
                transform: `translate(-50%,-50%) rotate(${deg}deg) translateY(-19px)`,
              }}
            />
          ))}
        </div>
        {/* 유리 반사 — 광원은 좌상단 */}
        <span
          aria-hidden
          className="absolute rounded-[50%]"
          style={{
            left: "17%",
            top: "13%",
            width: "36%",
            height: "24%",
            background:
              "linear-gradient(138deg, rgba(255,255,255,.26), rgba(255,255,255,0) 78%)",
            filter: "blur(1px)",
          }}
        />
      </div>
    </Volume>
  );
}

/** 리모컨 — "AI 매직 리모컨". 가운데 AI 버튼만 맥동한다. */
function Remote() {
  /* 두께를 20 → 15 로 줄였다. 손에 쥐는 물건인데 이전 비율은 벽돌에 가까웠다. */
  return (
    <Volume w={38} h={138} d={15} radius={9}>
      <div className="flex h-full flex-col items-center pt-[11px]">
        <span className="size-[8px] rounded-full border border-white/35" />
        <span className="mt-[7px] h-[3px] w-5 rounded-full bg-white/16" />
        <div className="relative mt-[9px] size-[26px] rounded-full border border-white/28">
          <div className="absolute inset-[8px] rounded-full border border-white/20" />
        </div>
        <span
          data-ai
          className="mt-[9px] rounded-full px-[6px] py-[3px] font-mono text-[6px] leading-none tracking-[0.12em] text-white"
          style={{ background: "var(--color-brand)" }}
        >
          AI
        </span>
        <div className="mt-[9px] grid grid-cols-2 gap-[4px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="h-[3px] w-[9px] rounded-full bg-white/14" />
          ))}
        </div>
      </div>
    </Volume>
  );
}

/** 냉장고 — "인공지능 냉기케어 시스템". 냉기 선이 문 위를 흐른다. */
function Fridge() {
  return (
    <Volume w={80} h={130} d={62}>
      <div className="relative h-full">
        {/* 냉장실 / 냉동실 경계 */}
        <div className="absolute inset-x-0 top-[76px] h-px bg-white/18" />
        {/* 손잡이 */}
        <div className="absolute top-[15px] left-[10px] h-[50px] w-[3px] rounded-full bg-white/28" />
        <div className="absolute top-[87px] left-[10px] h-[28px] w-[3px] rounded-full bg-white/28" />
        {/* 조작 패널 */}
        <div
          className="absolute top-[11px] right-[9px] h-[13px] w-[20px] rounded-[2px] border border-white/22"
          style={{ background: "rgba(30,107,255,0.28)" }}
        />
        {/* 냉기 */}
        <div className="absolute top-[38px] right-[9px] flex flex-col items-end gap-[6px]">
          {[24, 15, 20].map((w, i) => (
            <span
              key={w}
              data-chill
              className="h-px"
              style={{
                width: w,
                background: "var(--color-accent)",
                opacity: 0.55 - i * 0.1,
              }}
            />
          ))}
        </div>
      </div>
    </Volume>
  );
}

const MODELS: Record<AdProduct, () => ReactNode> = {
  washer: Washer,
  remote: Remote,
  fridge: Fridge,
};

/** 정지 자세. 셋을 서로 다르게 틀어야 늘어선 상자로 보이지 않는다. */
const POSE: Record<AdProduct, string> = {
  washer: "rotateX(-8deg) rotateY(24deg)",
  remote: "rotateX(-5deg) rotateY(-20deg) rotateZ(-9deg)",
  fridge: "rotateX(-8deg) rotateY(-23deg)",
};

/* ══ 무대 ════════════════════════════════════════════════════════════ */

export function AdMockup({
  quotes,
  className,
}: {
  quotes: AdQuote[];
  className?: string;
}) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const stage = stageRef.current;
    if (!scene || !stage) return;

    const spatial = window.matchMedia("(min-width: 1024px)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    /** 좁은 화면·모션 최소화에서는 CSS 가 그린 평면 배치를 그대로 둔다. */
    let teardown: (() => void) | null = null;

    const build = () => {
      if (!spatial.matches || still.matches) return;

      const layers = Array.from(stage.querySelectorAll<HTMLElement>("[data-layer]"));
      const pick = <T extends HTMLElement>(el: HTMLElement, sel: string) =>
        el.querySelector<T>(sel);

      /* ── 상시: 제품이 저마다의 주기로 살아 있다 ───────────────────── */
      const idle = layers.flatMap((layer, i) => {
        const model = pick(layer, "[data-model]");
        const spin = pick(layer, "[data-spin]");
        const ai = pick(layer, "[data-ai]");
        const chill = Array.from(layer.querySelectorAll<HTMLElement>("[data-chill]"));

        const running = [];
        if (model) {
          running.push(
            animate(model, {
              rotateY: [{ from: -6, to: 6 }],
              translateY: [{ from: -4, to: 4 }],
              duration: SWAY[i],
              loop: true,
              alternate: true,
              ease: "inOut(2)",
            }),
          );
        }
        if (spin) {
          running.push(
            animate(spin, { rotate: 360, duration: 11000, loop: true, ease: "linear" }),
          );
        }
        if (ai) {
          running.push(
            animate(ai, {
              opacity: [{ from: 1, to: 0.45 }],
              scale: [{ from: 1, to: 1.14 }],
              duration: 1300,
              loop: true,
              alternate: true,
              ease: "inOut(2)",
            }),
          );
        }
        if (chill.length) {
          running.push(
            animate(chill, {
              translateX: [{ from: 0, to: -7 }],
              duration: 2200,
              delay: stagger(180),
              loop: true,
              alternate: true,
              ease: "inOut(2)",
            }),
          );
        }
        return running;
      });

      /* ── 반복: 검증선이 하나씩 훑는다 ─────────────────────────────── */
      const loop = createTimeline({ loop: true, autoplay: false });

      layers.forEach((layer, i) => {
        const at = i * STEP;
        const scan = pick(layer, "[data-scan]");
        const mark = pick(layer, "[data-mark]");
        const object = pick(layer, "[data-object]");
        const reach = object ? object.clientHeight : 170;

        if (scan) {
          loop.add(
            scan,
            {
              opacity: [
                { from: 0, to: 0.9, duration: 150 },
                { to: 0.9, duration: 420 },
                { to: 0, duration: 190 },
              ],
              translateY: [{ from: -4, to: reach - 4, duration: 760, ease: "linear" }],
            },
            at,
          );
        }
        /* `from` 을 반드시 적는다. 생략하면 타임라인이 처음 만들어진 순간의
           값이 시작점으로 굳는데, 그때는 진입 연출 전이라 전부 0 이다.
           그러면 한 바퀴 돌 때마다 가운데 칸이 뒤로 튕긴다. */
        loop.add(
          layer,
          {
            translateZ: [
              { from: DEPTH[i], to: DEPTH[i] + 28, duration: 260, ease: "out(3)" },
              { to: DEPTH[i], duration: 660, ease: "inOut(2)" },
            ],
          },
          at + 360,
        );
        if (mark) {
          loop.add(
            mark,
            {
              opacity: [
                { from: 0.45, to: 1, duration: 160 },
                { to: 0.45, duration: 560 },
              ],
              scale: [
                { from: 1, to: 1.9, duration: 160, ease: "out(3)" },
                { to: 1, duration: 560, ease: "inOut(2)" },
              ],
            },
            at + 540,
          );
        }
      });

      /* 마지막 여백 — 타임라인을 늘려 다음 훑기 전에 정적을 만든다 */
      const tail = pick(layers[layers.length - 1] ?? stage, "[data-scan]");
      if (tail) loop.add(tail, { opacity: 0, duration: REST }, layers.length * STEP);

      /* ── 진입: 세 칸이 깊이에서 차례로 떠오른다 ───────────────────── */
      const enter = createTimeline({
        autoplay: false,
        onComplete: () => loop.play(),
      });

      layers.forEach((el, i) => {
        enter.add(
          el,
          {
            opacity: [0, 1],
            translateY: [44, 0],
            translateZ: [DEPTH[i] - 180, DEPTH[i]],
            rotateY: [YAW[i] * 2.4, YAW[i]],
            duration: 900,
            ease: "out(3)",
          },
          120 + i * 130,
        );
      });

      /* ── 시차: 포인터를 따라 무대 전체가 기운다 ───────────────────── */
      const tilt = createAnimatable(stage, {
        rotateX: { duration: 620, ease: "out(3)" },
        rotateY: { duration: 620, ease: "out(3)" },
      });
      tilt.rotateX(REST_TILT.x);
      tilt.rotateY(REST_TILT.y);

      const fine = window.matchMedia("(pointer: fine)").matches;
      const onMove = (e: PointerEvent) => {
        const r = scene.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        tilt.rotateY(REST_TILT.y + nx * 8);
        tilt.rotateX(REST_TILT.x - ny * 7);
      };
      const onLeave = () => {
        tilt.rotateX(REST_TILT.x);
        tilt.rotateY(REST_TILT.y);
      };
      if (fine) {
        scene.addEventListener("pointermove", onMove);
        scene.addEventListener("pointerleave", onLeave);
      }

      /* 화면에 들어올 때 시작한다. 한 번 보고 나면 관찰을 끊는다 —
         스냅 스크롤로 오르내릴 때마다 다시 조립되면 멀미가 난다. */
      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          enter.play();
          io.disconnect();
        },
        { threshold: 0.2 },
      );
      io.observe(scene);

      teardown = () => {
        io.disconnect();
        scene.removeEventListener("pointermove", onMove);
        scene.removeEventListener("pointerleave", onLeave);
        enter.revert();
        loop.revert();
        tilt.revert();
        idle.forEach((a) => a.revert());
      };
    };

    build();

    /* 창을 가로질러 크기를 바꾸면 배치 기준 자체가 달라진다. 남은 인라인
       transform 을 걷어내고 다시 짠다. */
    const rebuild = () => {
      teardown?.();
      teardown = null;
      build();
    };
    spatial.addEventListener("change", rebuild);
    still.addEventListener("change", rebuild);

    return () => {
      spatial.removeEventListener("change", rebuild);
      still.removeEventListener("change", rebuild);
      teardown?.();
    };
  }, []);

  return (
    <div ref={sceneRef} className={cn("claim-scene", className)}>
      <div
        ref={stageRef}
        className="claim-stage grid grid-cols-1 gap-x-9 gap-y-10 sm:grid-cols-3"
      >
        {quotes.map((quote, i) => {
          const Model = MODELS[quote.product];
          return (
            <div key={quote.headline} data-layer data-i={i} className="claim-layer">
              {/* 제품 — 장식이 아니라 인용의 출처지만, 글자로 읽히지는
                  않으므로 접근성 트리에서는 뺀다. */}
              <div data-object aria-hidden className="claim-object">
                <div data-model className="claim-model">
                  <div className="claim-body" style={{ transform: POSE[quote.product] }}>
                    <Model />
                  </div>
                </div>
                {/* 제품을 훑는 검증선. 항상 부피 앞쪽에 뜬다. */}
                <div
                  data-scan
                  className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0"
                  style={{
                    transform: "translateZ(70px)",
                    background:
                      "linear-gradient(90deg, rgba(224,81,47,0) 0%, var(--color-missing) 50%, rgba(224,81,47,0) 100%)",
                    boxShadow: "0 0 10px rgba(224,81,47,0.55)",
                  }}
                />
              </div>

              <div className="mt-6 border-t border-white/20 pt-5">
                <p className="font-mono text-xs tracking-[var(--tracking-label)] text-white/30">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <p className="mt-3.5 text-[17px] leading-snug font-medium text-white lg:text-[15px]">
                  “{quote.headline}”
                </p>
                <p className="mt-2.5 text-xs leading-relaxed text-white/55">
                  {quote.body}
                </p>
                {/* 점만 깜빡인다. 글자를 흐리면 이 화면에서 가장 중요한
                    단어의 대비가 떨어진다. */}
                <p className="mt-4 flex items-center gap-1.5 font-mono text-xs tracking-[var(--tracking-label)] text-[color:var(--color-missing)]">
                  <span
                    data-mark
                    className="size-[5px] shrink-0 rounded-full bg-[color:var(--color-missing)] opacity-45"
                  />
                  근거 미확인
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
