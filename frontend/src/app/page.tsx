"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getStoredToken } from "@/lib/auth";

import "./landing.css";

export default function LandingPage() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  // localStorage는 클라이언트 전용 → useEffect에서만 읽기
  useEffect(() => {
    setLoggedIn(!!getStoredToken());
  }, []);

  function isLoggedIn() {
    return !!getStoredToken();
  }

  function goAnalyze() {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    const input = document.getElementById("urlInput") as HTMLInputElement | null;
    const u = input?.value.trim();
    if (u) router.push("/analysis?url=" + encodeURIComponent(u));
    else document.getElementById("s1")?.scrollIntoView({ behavior: "smooth" });
  }

  function goStart() {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    document.getElementById("s1")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => (document.getElementById("urlInput") as HTMLInputElement | null)?.focus(), 600);
  }

  useEffect(() => {
    /* ── cursor glow ── */
    const cg = document.getElementById("lp-cglow");
    const handleMouseMove = (e: MouseEvent) => {
      if (cg) { cg.style.left = e.clientX + "px"; cg.style.top = e.clientY + "px"; }
    };
    document.addEventListener("mousemove", handleMouseMove);

    /* ── scroll snap ── */
    const SNAPS = ["s1", "slogos", "s3", "s5", "s6", "s7"];
    let curIdx = 0;
    let busy = false;
    let touchStartY = 0;

    function goTo(idx: number, smooth = true) {
      idx = Math.max(0, Math.min(SNAPS.length - 1, idx));
      if (idx === curIdx && smooth) return;
      curIdx = idx;
      busy = true;
      const el = document.getElementById(SNAPS[idx]);
      if (el) el.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
      setTimeout(() => { busy = false; }, 900);
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (busy) return;
      goTo(curIdx + (e.deltaY > 0 ? 1 : -1));
    };
    window.addEventListener("wheel", handleWheel, { passive: false });

    const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
    const handleTouchEnd = (e: TouchEvent) => {
      if (busy) return;
      const dy = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(dy) < 40) return;
      goTo(curIdx + (dy > 0 ? 1 : -1));
    };
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (busy) return;
      if (e.key === "ArrowDown" || e.key === "PageDown") { e.preventDefault(); goTo(curIdx + 1); }
      if (e.key === "ArrowUp"   || e.key === "PageUp"  ) { e.preventDefault(); goTo(curIdx - 1); }
      if (e.key === "Home") { e.preventDefault(); goTo(0); }
      if (e.key === "End")  { e.preventDefault(); goTo(SNAPS.length - 1); }
    };
    window.addEventListener("keydown", handleKeyDown);

    /* ── section progress bar ── */
    const SNAP_SM = [
      { id: "s1",     n: "01", l: "Hero" },
      { id: "slogos", n: "02", l: "Data Sources" },
      { id: "s3",     n: "03", l: "Problem" },
      { id: "s5",     n: "04", l: "Pipeline" },
      { id: "s6",     n: "05", l: "Scoring" },
      { id: "s7",     n: "06", l: "Get Started" },
    ];
    const pbar = document.getElementById("lp-pbar");
    let lastIdx = -1;

    function updateSection(idx: number) {
      if (idx === lastIdx) return;
      lastIdx = idx;
      if (pbar) pbar.style.width = ((idx + 1) / SNAP_SM.length * 100) + "%";
    }

    const ioSec = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const idx = SNAP_SM.findIndex(s => s.id === e.target.id);
        if (idx < 0) return;
        curIdx = idx;
        updateSection(idx);
      });
    }, { threshold: .45 });
    document.querySelectorAll(".snap, #slogos").forEach(s => ioSec.observe(s));

    /* ── reveal animations ── */
    const rv = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) e.target.classList.add("in"); });
    }, { threshold: .08 });
    document.querySelectorAll(".rv").forEach(el => rv.observe(el));

    /* ── counter animation ── */
    const co = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        const t = parseInt(el.dataset.cnt ?? "0");
        if (!t) return;
        let n = 0; const inc = t / 60;
        const tm = setInterval(() => {
          n += inc;
          if (n >= t) { n = t; clearInterval(tm); }
          el.textContent = String(Math.floor(n));
        }, 16);
        co.unobserve(el);
      });
    }, { threshold: .5 });
    document.querySelectorAll("[data-cnt]").forEach(el => co.observe(el));

    /* ── pipeline dot animation ── */
    (function () {
      const layer = document.getElementById("pipeDotsLayer");
      if (!layer) return;
      const L = ["pL1", "pL2", "pL3", "pL4"];
      const R = ["pR1", "pR2", "pR3", "pR4"];
      const TRAIL = 5;
      const DUR = 3400;
      const MAX = 4;
      const activeCount: Record<string, number> = {};
      const vlineEls: Record<string, SVGElement | null> = {};
      ["pL1","pL2","pL3","pL4","pC","pR1","pR2","pR3","pR4"].forEach(id => {
        vlineEls[id] = document.getElementById("v" + id) as SVGElement | null;
        activeCount[id] = 0;
      });

      function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }

      function makeJourney() {
        const fwd = Math.random() < .5;
        const li = pick(L), ri = pick(R);
        const getPath = (id: string) => document.getElementById(id) as SVGGeometryElement | null;
        return fwd
          ? [{ id: li, path: getPath(li)!, fwd: true },
             { id: "pC", path: getPath("pC")!, fwd: true },
             { id: ri, path: getPath(ri)!, fwd: true }]
          : [{ id: ri, path: getPath(ri)!, fwd: false },
             { id: "pC", path: getPath("pC")!, fwd: false },
             { id: li, path: getPath(li)!, fwd: false }];
      }

      function ptAt(seg: { path: SVGGeometryElement; fwd: boolean }, t: number) {
        const len = seg.path.getTotalLength();
        return seg.path.getPointAtLength(seg.fwd ? t * len : (1 - t) * len);
      }

      function posAtT(journey: ReturnType<typeof makeJourney>, breaks: number[], t: number) {
        for (let i = 0; i < journey.length; i++) {
          if (t <= breaks[i + 1] + .001) {
            const lt = Math.min(1, (t - breaks[i]) / (breaks[i + 1] - breaks[i]));
            return { pt: ptAt(journey[i], lt), si: i };
          }
        }
        return { pt: ptAt(journey[journey.length - 1], 1), si: journey.length - 1 };
      }

      function setLine(id: string, on: boolean) {
        const el = vlineEls[id]; if (!el) return;
        activeCount[id] = Math.max(0, activeCount[id] + (on ? 1 : -1));
        el.classList.toggle("active", activeCount[id] > 0);
      }

      function spawnDot() {
        const journey = makeJourney();
        const lens = journey.map(s => s.path.getTotalLength());
        const total = lens.reduce((a, b) => a + b, 0);
        const breaks = [0];
        lens.forEach((l, i) => breaks.push(breaks[i] + l / total));

        const circles = Array.from({ length: TRAIL }, (_, i) => {
          const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          c.setAttribute("r", i === 0 ? "4" : (3.5 - i * .55).toFixed(1));
          c.setAttribute("fill", i === 0 ? "rgba(37,99,235,0.95)" : `rgba(37,99,235,${(.65 - i * .12).toFixed(2)})`);
          c.setAttribute("opacity", "0");
          layer!.appendChild(c);
          return c;
        });

        const t0 = performance.now() + Math.random() * 900;
        const dur = DUR * (0.82 + Math.random() * .36);
        let curSi = -1;

        function tick(now: number) {
          const t = (now - t0) / dur;
          if (t < 0) { requestAnimationFrame(tick); return; }
          if (t >= 1) {
            circles.forEach(c => c.remove());
            if (curSi >= 0) setLine(journey[curSi].id, false);
            setTimeout(spawnDot, 250 + Math.random() * 700);
            return;
          }
          const op = t < .07 ? t / .07 : t > .86 ? (1 - t) / .14 : 1;
          const { pt, si } = posAtT(journey, breaks, t);
          if (si !== curSi) {
            if (curSi >= 0) setLine(journey[curSi].id, false);
            setLine(journey[si].id, true);
            curSi = si;
          }
          circles[0].setAttribute("cx", pt.x.toFixed(2));
          circles[0].setAttribute("cy", pt.y.toFixed(2));
          circles[0].setAttribute("opacity", (op * .95).toFixed(3));
          for (let i = 1; i < TRAIL; i++) {
            const tTrail = Math.max(0, t - i * .02);
            const tOp = op * (.55 - i * .11);
            if (tOp > .015) {
              const { pt: tp } = posAtT(journey, breaks, tTrail);
              circles[i].setAttribute("cx", tp.x.toFixed(2));
              circles[i].setAttribute("cy", tp.y.toFixed(2));
              circles[i].setAttribute("opacity", Math.max(0, tOp).toFixed(3));
            } else {
              circles[i].setAttribute("opacity", "0");
            }
          }
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }
      for (let i = 0; i < MAX; i++) setTimeout(spawnDot, i * 750);
    })();

    /* ── prob-items cycling ── */
    const probItems = ["pi1", "pi2", "pi3"];
    let probStep = 0;
    document.getElementById("pi1")?.classList.add("active");
    const probInterval = setInterval(() => {
      probStep++;
      if (probStep >= probItems.length) {
        probStep = 0;
        probItems.forEach(id => document.getElementById(id)?.classList.remove("active"));
        setTimeout(() => {
          document.getElementById(probItems[0])?.classList.add("active");
          probStep = 0;
        }, 600);
        return;
      }
      document.getElementById(probItems[probStep])?.classList.add("active");
    }, 2000);

    /* ── hero letter animation ── */
    (function () {
      const heroH = document.querySelector(".hero-h") as HTMLElement | null;
      if (!heroH) return;
      const text = heroH.textContent?.trim() ?? "";
      heroH.innerHTML = "";
      heroH.style.opacity = "1";
      heroH.style.transform = "none";
      heroH.classList.remove("rv", "d1");
      text.split("").forEach((ch, i) => {
        const s = document.createElement("span");
        s.className = "letter";
        s.textContent = ch;
        s.style.animationDelay = (0.15 + i * 0.09) + "s";
        heroH.appendChild(s);
      });
    })();

    /* ── feature card bar hover ── */
    document.querySelectorAll<HTMLElement>(".fcard").forEach(card => {
      const fill = card.querySelector<HTMLElement>(".fcard-bar-fill");
      if (!fill) return;
      const target = fill.style.width || "0%";
      fill.dataset.target = target;
      fill.style.width = "0%";
      const obs = new IntersectionObserver(es => {
        es.forEach(e => {
          if (!e.isIntersecting) return;
          setTimeout(() => { fill.style.width = target; }, 250);
          obs.unobserve(card);
        });
      }, { threshold: .3 });
      obs.observe(card);
      card.addEventListener("mouseenter", () => {
        fill.style.transition = "none";
        fill.style.width = "0%";
        requestAnimationFrame(() => requestAnimationFrame(() => {
          fill.style.transition = "width .75s cubic-bezier(.16,1,.3,1)";
          fill.style.width = target;
        }));
      });
    });

    /* ── nav cta ── */
    document.querySelector(".nav-cta")?.addEventListener("click", () => {
      document.getElementById("s1")?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => (document.getElementById("urlInput") as HTMLInputElement | null)?.focus(), 600);
    });

    /* ── url input enter ── */
    const urlInput = document.getElementById("urlInput") as HTMLInputElement | null;
    const handleEnter = (e: KeyboardEvent) => { if (e.key === "Enter") goAnalyze(); };
    urlInput?.addEventListener("keydown", handleEnter);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(probInterval);
      ioSec.disconnect();
      rv.disconnect();
      co.disconnect();
      urlInput?.removeEventListener("keydown", handleEnter);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="lp">
      <div id="lp-cglow" />
      <div id="lp-pbar" />

      {/* NAV */}
      <nav className="lp-nav">
        <span className="nav-about" onClick={() => document.getElementById("s5")?.scrollIntoView({ behavior: "smooth" })}>About</span>
        <span className="nav-logo">Fides</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!loggedIn && (
            <>
              <button
                onClick={() => router.push("/login?tab=register")}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "rgba(14,17,32,.5)", letterSpacing: ".01em", padding: 0, transition: "color .2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#0e1120")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(14,17,32,.5)")}
              >
                회원가입
              </button>
              <button
                onClick={() => router.push("/login")}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "rgba(14,17,32,.5)", letterSpacing: ".01em", padding: 0, transition: "color .2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#0e1120")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(14,17,32,.5)")}
              >
                로그인
              </button>
            </>
          )}
          {loggedIn && (
            <button
              onClick={() => { localStorage.removeItem("fides_token"); localStorage.removeItem("fides_user"); router.refresh(); setLoggedIn(false); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "rgba(14,17,32,.45)", letterSpacing: ".01em", padding: 0 }}
            >
              로그아웃
            </button>
          )}
          <button className="nav-cta" onClick={() => router.push(loggedIn ? "/dashboard" : "/login")}>
            {loggedIn ? "Dashboard" : "분석 시작 →"}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="snap" id="s1">
        <div className="hero-inner">
          <h1 className="hero-h rv d1">FIDES</h1>
          <p className="hero-desc rv d2">
            제품 URL 하나로 텍스트·검증·관계형<br />
            세 차원의 신뢰도를 온톨로지 기반으로 분석합니다
          </p>
          <div className="hero-form rv d3">
            <input
              className="hero-input"
              id="urlInput"
              placeholder="https://prod.danawa.com/info/?pcode=…"
            />
            <button className="hero-btn" onClick={goAnalyze}>분석 시작 →</button>
          </div>
        </div>
        <div className="hero-vline" />
      </section>

      {/* DATA SOURCES */}
      <section id="slogos">
        <div className="ds-inner">
          <span className="slabel rv">Why Trust Us</span>
          <h2 className="ds-h rv d1">
            데이터로 검증하고,<br />
            <span style={{ color: "#2563eb" }}>숫자로 증명합니다</span>
          </h2>
          <p className="ds-sub rv d2">
            단순 텍스트 분석이 아닙니다. 국내 공인 인증 기관과 특허청·공시 데이터를<br />
            실시간 교차 검증해 AI 신뢰성 여부를 판단합니다.
          </p>
          <div className="stats-grid rv d3">
            <div className="stat">
              <div className="stat-bar" />
              <p className="stat-l">파이프라인 단계</p>
              <p className="stat-n" data-cnt="6">0</p>
              <p className="stat-d">크롤링부터 종합 분석까지</p>
            </div>
            <div className="stat">
              <div className="stat-bar" />
              <p className="stat-l">공공 데이터 소스</p>
              <p className="stat-n">4<span style={{ fontSize: ".42em", color: "rgba(14,17,32,.45)" }}>+</span></p>
              <p className="stat-d">전파인증 · 조달청 · TIPA · KORAIA</p>
            </div>
            <div className="stat">
              <div className="stat-bar" />
              <p className="stat-l">특허 · 인증 DB</p>
              <p className="stat-n" data-cnt="3">0</p>
              <p className="stat-d">KIPRIS · GS · NEP</p>
            </div>
            <div className="stat">
              <div className="stat-bar" />
              <p className="stat-l">분석 결과 등급</p>
              <p className="stat-n">5</p>
              <p className="stat-d">High · Medium · Low · Safe · N/A</p>
            </div>
          </div>
          <div className="ds-divider rv d4">
            <span className="ds-div-label">연동된 공공 데이터 소스</span>
          </div>
          <div className="mq-fade">
            <div className="mq-wrap rv d4">
              <div className="mq-track">
                {["KC 인증 DB","조달청 MAS","KIPRIS 특허","TIPA 제조AI","KORAIA","DART 공시","GS 인증","NEP 인증","전파인증",
                  "KC 인증 DB","조달청 MAS","KIPRIS 특허","TIPA 제조AI","KORAIA","DART 공시","GS 인증","NEP 인증","전파인증"]
                  .map((name, i) => (
                  <span key={i} className="logo-badge">
                    <span className="lb-dot" />
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="snap" id="s3">
        <div className="prob-split">
          <div className="prob-left">
            <div className="cube-scene">
              <div className="cube-glow-bg" />
              <div className="cube">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="c-face"><div className="c-face-inner" /></div>
                ))}
              </div>
              <div className="cube-orbit">
                <div className="cube-small">
                  {[...Array(6)].map((_, i) => <div key={i} className="c-face" />)}
                </div>
              </div>
            </div>
          </div>
          <div className="prob-right">
            <span className="slabel">The Problem</span>
            <h2 className="prob-heading">
              AI 주장을<br />검증할 수 없다면,<br />소비자는 속을<br />수밖에 없습니다.
            </h2>
            <div className="prob-list">
              <div className="prob-item" id="pi1">
                <span className="prob-item-n">01</span>
                <div>
                  <p className="prob-item-t">검증되지 않은 AI 주장</p>
                  <p className="prob-item-d">AI 기능을 명시하지만 실제 구현 증거가 없는 제품이 시장을 점유합니다.</p>
                </div>
              </div>
              <div className="prob-item" id="pi2">
                <span className="prob-item-n">02</span>
                <div>
                  <p className="prob-item-t">불투명한 기술 공개</p>
                  <p className="prob-item-d">특허·인증·공공 데이터 어디에도 근거 없이 "AI 탑재"를 내세웁니다.</p>
                </div>
              </div>
              <div className="prob-item" id="pi3">
                <span className="prob-item-n">03</span>
                <div>
                  <p className="prob-item-t">소비자 정보 비대칭</p>
                  <p className="prob-item-d">객관적 기준 없이는 AI 신뢰성 여부를 소비자가 판단할 수 없습니다.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PIPELINE */}
      <section className="snap" id="s5">
        <div className="inner" style={{ maxWidth: "1200px" }}>
          <span className="slabel rv">How It Works</span>
          <h2 className="sec-h rv d1">6단계 <span className="hl">분석 파이프라인</span></h2>
          <p className="sec-sub rv d2" style={{ marginBottom: "36px" }}>
            URL 하나를 입력하면 크롤링부터 온톨로지 분석까지 자동으로 수행합니다.
          </p>
          <div className="rv d3" style={{ width: "100%", overflowX: "auto", overflowY: "visible" }}>
            <svg viewBox="0 0 1200 460" xmlns="http://www.w3.org/2000/svg"
              style={{ width: "100%", minWidth: "700px", display: "block", overflow: "visible" }}>
              <defs>
                <radialGradient id="cg" cx="50%" cy="50%" r="40%">
                  <stop offset="0%"   stopColor="#2563eb" stopOpacity="0.12"/>
                  <stop offset="55%"  stopColor="#2563eb" stopOpacity="0.03"/>
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0"/>
                </radialGradient>
                <filter id="boxglow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur"/>
                  <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                </filter>
                <filter id="lg" x="-20%" y="-200%" width="140%" height="500%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
                </filter>
                <filter id="lga" x="-30%" y="-300%" width="160%" height="700%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/>
                  <feComposite in="SourceGraphic" in2="b" operator="over"/>
                </filter>
                <filter id="dg" x="-300%" y="-300%" width="700%" height="700%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b1"/>
                  <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b2"/>
                  <feMerge><feMergeNode in="b1"/><feMergeNode in="b2"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="wg" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur"/>
                  <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                </filter>
                <filter id="epg" x="-500%" y="-500%" width="1100%" height="1100%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4"/>
                </filter>
                <path id="pL1" d="M 178,75  C 300,75  340,220 362,220"/>
                <path id="pL2" d="M 178,140 C 285,140 335,220 362,220"/>
                <path id="pL3" d="M 178,300 C 285,300 335,220 362,220"/>
                <path id="pL4" d="M 178,365 C 300,365 340,220 362,220"/>
                <path id="pC"  d="M 462,220 L 738,220"/>
                <path id="pR1" d="M 838,220 C 858,220 955,75  1022,75"/>
                <path id="pR2" d="M 838,220 C 858,220 950,140 1022,140"/>
                <path id="pR3" d="M 838,220 C 858,220 950,300 1022,300"/>
                <path id="pR4" d="M 838,220 C 858,220 955,365 1022,365"/>
              </defs>

              <ellipse cx="600" cy="220" rx="320" ry="215" fill="url(#cg)"/>
              <ellipse cx="600" cy="220" rx="170" ry="120" fill="rgba(37,99,235,0.04)"/>

              <g fill="none" strokeLinecap="round" stroke="rgba(37,99,235,0.1)" strokeWidth="3" filter="url(#lg)">
                <path d="M 178,75  C 300,75  340,220 362,220"/>
                <path d="M 178,140 C 285,140 335,220 362,220"/>
                <path d="M 178,300 C 285,300 335,220 362,220"/>
                <path d="M 178,365 C 300,365 340,220 362,220"/>
                <line x1="462" y1="220" x2="738" y2="220"/>
                <path d="M 838,220 C 858,220 955,75  1022,75"/>
                <path d="M 838,220 C 858,220 950,140 1022,140"/>
                <path d="M 838,220 C 858,220 950,300 1022,300"/>
                <path d="M 838,220 C 858,220 955,365 1022,365"/>
              </g>
              <g fill="none" strokeLinecap="round" stroke="rgba(37,99,235,0.2)" strokeWidth="1.5">
                <path d="M 178,75  C 300,75  340,220 362,220"/>
                <path d="M 178,140 C 285,140 335,220 362,220"/>
                <path d="M 178,300 C 285,300 335,220 362,220"/>
                <path d="M 178,365 C 300,365 340,220 362,220"/>
                <line x1="462" y1="220" x2="738" y2="220"/>
                <path d="M 838,220 C 858,220 955,75  1022,75"/>
                <path d="M 838,220 C 858,220 950,140 1022,140"/>
                <path d="M 838,220 C 858,220 950,300 1022,300"/>
                <path d="M 838,220 C 858,220 955,365 1022,365"/>
              </g>

              <g fill="none" strokeLinecap="round" stroke="rgba(37,99,235,0.75)" strokeWidth="2.5" filter="url(#lga)">
                <path className="vline" id="vpL1" d="M 178,75  C 300,75  340,220 362,220"/>
                <path className="vline" id="vpL2" d="M 178,140 C 285,140 335,220 362,220"/>
                <path className="vline" id="vpL3" d="M 178,300 C 285,300 335,220 362,220"/>
                <path className="vline" id="vpL4" d="M 178,365 C 300,365 340,220 362,220"/>
                <line className="vline" id="vpC"  x1="462" y1="220" x2="738" y2="220"/>
                <path className="vline" id="vpR1" d="M 838,220 C 858,220 955,75  1022,75"/>
                <path className="vline" id="vpR2" d="M 838,220 C 858,220 950,140 1022,140"/>
                <path className="vline" id="vpR3" d="M 838,220 C 858,220 950,300 1022,300"/>
                <path className="vline" id="vpR4" d="M 838,220 C 858,220 955,365 1022,365"/>
              </g>

              <g filter="url(#epg)">
                <circle cx="178" cy="75"  r="5" fill="rgba(37,99,235,0.3)"/>
                <circle cx="178" cy="140" r="5" fill="rgba(37,99,235,0.3)"/>
                <circle cx="178" cy="300" r="5" fill="rgba(37,99,235,0.3)"/>
                <circle cx="178" cy="365" r="5" fill="rgba(37,99,235,0.3)"/>
                <circle cx="1022" cy="75"  r="5" fill="rgba(37,99,235,0.3)"/>
                <circle cx="1022" cy="140" r="5" fill="rgba(37,99,235,0.3)"/>
                <circle cx="1022" cy="300" r="5" fill="rgba(37,99,235,0.3)"/>
                <circle cx="1022" cy="365" r="5" fill="rgba(37,99,235,0.3)"/>
              </g>
              <g>
                <circle cx="178" cy="75"  r="3" fill="rgba(37,99,235,0.6)"/>
                <circle cx="178" cy="140" r="3" fill="rgba(37,99,235,0.6)"/>
                <circle cx="178" cy="300" r="3" fill="rgba(37,99,235,0.6)"/>
                <circle cx="178" cy="365" r="3" fill="rgba(37,99,235,0.6)"/>
                <circle cx="1022" cy="75"  r="3" fill="rgba(37,99,235,0.6)"/>
                <circle cx="1022" cy="140" r="3" fill="rgba(37,99,235,0.6)"/>
                <circle cx="1022" cy="300" r="3" fill="rgba(37,99,235,0.6)"/>
                <circle cx="1022" cy="365" r="3" fill="rgba(37,99,235,0.6)"/>
              </g>

              <g id="pipeDotsLayer" filter="url(#dg)" />

              <text x="8" y="225" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="9"
                fill="rgba(37,99,235,0.45)" letterSpacing="0.18em"
                transform="rotate(-90,8,225)">INPUT</text>
              <text x="1192" y="225" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="9"
                fill="rgba(37,99,235,0.45)" letterSpacing="0.18em"
                transform="rotate(90,1192,225)">OUTPUT</text>

              <g>
                <text x="34" y="50"  fontFamily="'JetBrains Mono',monospace" fontSize="8.5" fill="rgba(37,99,235,0.45)" letterSpacing=".1em">IN 01</text>
                <text x="34" y="115" fontFamily="'JetBrains Mono',monospace" fontSize="8.5" fill="rgba(37,99,235,0.45)" letterSpacing=".1em">IN 02</text>
                <text x="34" y="275" fontFamily="'JetBrains Mono',monospace" fontSize="8.5" fill="rgba(37,99,235,0.45)" letterSpacing=".1em">IN 03</text>
                <text x="34" y="340" fontFamily="'JetBrains Mono',monospace" fontSize="8.5" fill="rgba(37,99,235,0.45)" letterSpacing=".1em">IN 04</text>
                <rect x="28" y="55"  width="150" height="40" rx="8" fill="rgba(37,99,235,0.05)" stroke="rgba(37,99,235,0.18)" strokeWidth="1"/>
                <rect x="28" y="120" width="150" height="40" rx="8" fill="rgba(37,99,235,0.05)" stroke="rgba(37,99,235,0.18)" strokeWidth="1"/>
                <rect x="28" y="280" width="150" height="40" rx="8" fill="rgba(37,99,235,0.05)" stroke="rgba(37,99,235,0.18)" strokeWidth="1"/>
                <rect x="28" y="345" width="150" height="40" rx="8" fill="rgba(37,99,235,0.05)" stroke="rgba(37,99,235,0.18)" strokeWidth="1"/>
                <line x1="28" y1="60"  x2="28" y2="90"  stroke="rgba(37,99,235,0.55)" strokeWidth="2" strokeLinecap="round"/>
                <line x1="28" y1="125" x2="28" y2="155" stroke="rgba(37,99,235,0.55)" strokeWidth="2" strokeLinecap="round"/>
                <line x1="28" y1="285" x2="28" y2="315" stroke="rgba(37,99,235,0.55)" strokeWidth="2" strokeLinecap="round"/>
                <line x1="28" y1="350" x2="28" y2="380" stroke="rgba(37,99,235,0.55)" strokeWidth="2" strokeLinecap="round"/>
                <text x="48" y="80"  fontFamily="'JetBrains Mono',monospace" fontSize="13" fill="rgba(37,99,235,0.8)">⊙</text>
                <text x="48" y="145" fontFamily="'JetBrains Mono',monospace" fontSize="13" fill="rgba(37,99,235,0.8)">◫</text>
                <text x="48" y="305" fontFamily="'JetBrains Mono',monospace" fontSize="13" fill="rgba(37,99,235,0.8)">≡</text>
                <text x="48" y="370" fontFamily="'JetBrains Mono',monospace" fontSize="13" fill="rgba(37,99,235,0.8)">⊞</text>
                <text x="70" y="79"  fontSize="13" fill="rgba(14,17,32,0.75)">URL 입력</text>
                <text x="70" y="144" fontSize="13" fill="rgba(14,17,32,0.75)">이미지 OCR</text>
                <text x="70" y="304" fontSize="13" fill="rgba(14,17,32,0.75)">텍스트 스펙</text>
                <text x="70" y="369" fontSize="13" fill="rgba(14,17,32,0.75)">상품 데이터</text>
              </g>

              <rect x="350" y="166" width="116" height="108" rx="22" fill="rgba(37,99,235,0.08)" filter="url(#boxglow)"/>
              <rect x="358" y="170" width="104" height="100" rx="18" fill="#edf1fc" stroke="rgba(37,99,235,0.45)" strokeWidth="1.5"/>
              <rect x="383" y="193" width="54" height="52" rx="6" fill="none" stroke="rgba(37,99,235,0.6)" strokeWidth="1.8"/>
              <line x1="392" y1="210" x2="428" y2="210" stroke="rgba(37,99,235,0.55)" strokeWidth="2"/>
              <line x1="392" y1="221" x2="422" y2="221" stroke="rgba(37,99,235,0.35)" strokeWidth="1.5"/>
              <line x1="392" y1="230" x2="426" y2="230" stroke="rgba(37,99,235,0.25)" strokeWidth="1"/>
              <line x1="392" y1="238" x2="415" y2="238" stroke="rgba(37,99,235,0.18)" strokeWidth="1"/>
              <text x="410" y="298" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="10" fill="rgba(37,99,235,0.55)" letterSpacing=".08em">FIDES</text>

              <ellipse cx="605" cy="220" rx="90" ry="55" fill="rgba(37,99,235,0.04)" filter="url(#wg)"/>

              {/* Engine 1: Ollama */}
              <rect id="eBox1" x="498" y="184" width="70" height="72" rx="14" fill="#edf0fc" stroke="rgba(37,99,235,0.35)" strokeWidth="1.5"
                style={{ animation: "enginePulse 3.6s ease-in-out infinite 0s", transformOrigin: "533px 220px" }}/>
              <g>
                <polygon points="519,229 533,205 547,229" fill="rgba(37,99,235,0.08)" stroke="rgba(37,99,235,0.6)" strokeWidth="1.6" strokeLinejoin="round"/>
                <polygon points="524,229 533,214 542,229" fill="rgba(37,99,235,0.14)" stroke="rgba(37,99,235,0.45)" strokeWidth="1.2" strokeLinejoin="round"/>
                <circle cx="533" cy="205" r="2.2" fill="rgba(37,99,235,0.55)"/>
              </g>
              <text x="533" y="244" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="8" fill="rgba(37,99,235,0.7)" letterSpacing=".06em">OLLAMA</text>

              {/* Engine 2: LLM */}
              <rect id="eBox2" x="570" y="184" width="70" height="72" rx="14" fill="#edf0fc" stroke="rgba(37,99,235,0.35)" strokeWidth="1.5"
                style={{ animation: "enginePulse 3.6s ease-in-out infinite 1.2s", transformOrigin: "605px 220px" }}/>
              <g>
                <rect x="592" y="207" width="26" height="3.5" rx="1.8" fill="rgba(37,99,235,0.7)"/>
                <rect x="594" y="214" width="22" height="3.5" rx="1.8" fill="rgba(37,99,235,0.5)"/>
                <rect x="596" y="221" width="18" height="3.5" rx="1.8" fill="rgba(37,99,235,0.35)"/>
                <circle cx="605" cy="231" r="2.5" fill="rgba(37,99,235,0.55)"/>
                <line x1="599" y1="231" x2="611" y2="231" stroke="rgba(37,99,235,0.3)" strokeWidth="1"/>
              </g>
              <text x="605" y="244" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="8" fill="rgba(37,99,235,0.7)" letterSpacing=".04em">LLM</text>

              {/* Engine 3: Ontology */}
              <rect id="eBox3" x="642" y="184" width="70" height="72" rx="14" fill="#edf0fc" stroke="rgba(37,99,235,0.35)" strokeWidth="1.5"
                style={{ animation: "enginePulse 3.6s ease-in-out infinite 2.4s", transformOrigin: "677px 220px" }}/>
              <g>
                <circle cx="677" cy="215" r="5" fill="rgba(37,99,235,0.15)" stroke="rgba(37,99,235,0.7)" strokeWidth="1.6"/>
                <circle cx="665" cy="228" r="3.2" fill="rgba(37,99,235,0.1)" stroke="rgba(37,99,235,0.5)" strokeWidth="1.3"/>
                <circle cx="689" cy="228" r="3.2" fill="rgba(37,99,235,0.1)" stroke="rgba(37,99,235,0.5)" strokeWidth="1.3"/>
                <circle cx="677" cy="205" r="3.2" fill="rgba(37,99,235,0.1)" stroke="rgba(37,99,235,0.45)" strokeWidth="1.3"/>
                <line x1="677" y1="208" x2="677" y2="210" stroke="rgba(37,99,235,0.4)" strokeWidth="1.2"/>
                <line x1="673" y1="218" x2="668" y2="225" stroke="rgba(37,99,235,0.4)" strokeWidth="1.2"/>
                <line x1="681" y1="218" x2="686" y2="225" stroke="rgba(37,99,235,0.4)" strokeWidth="1.2"/>
              </g>
              <text x="677" y="244" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="8" fill="rgba(37,99,235,0.7)" letterSpacing=".04em">ONTOLOGY</text>

              <text x="605" y="274" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="9"
                fill="rgba(37,99,235,0.48)" letterSpacing=".12em">INFERENCE PIPELINE</text>

              <rect x="734" y="166" width="116" height="108" rx="22" fill="rgba(37,99,235,0.08)" filter="url(#boxglow)"/>
              <rect x="738" y="170" width="104" height="100" rx="18" fill="#edf1fc" stroke="rgba(37,99,235,0.45)" strokeWidth="1.5"/>
              <rect x="763" y="193" width="54" height="52" rx="6" fill="none" stroke="rgba(37,99,235,0.6)" strokeWidth="1.8"/>
              <line x1="772" y1="210" x2="808" y2="210" stroke="rgba(37,99,235,0.55)" strokeWidth="2"/>
              <line x1="772" y1="221" x2="802" y2="221" stroke="rgba(37,99,235,0.35)" strokeWidth="1.5"/>
              <line x1="772" y1="230" x2="806" y2="230" stroke="rgba(37,99,235,0.25)" strokeWidth="1"/>
              <line x1="772" y1="238" x2="795" y2="238" stroke="rgba(37,99,235,0.18)" strokeWidth="1"/>
              <text x="790" y="298" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="10" fill="rgba(37,99,235,0.55)" letterSpacing=".08em">FIDES</text>

              <g>
                <text x="1028" y="50"  fontFamily="'JetBrains Mono',monospace" fontSize="8.5" fill="rgba(37,99,235,0.45)" letterSpacing=".1em">OUT A</text>
                <text x="1028" y="115" fontFamily="'JetBrains Mono',monospace" fontSize="8.5" fill="rgba(37,99,235,0.45)" letterSpacing=".1em">OUT B</text>
                <text x="1028" y="275" fontFamily="'JetBrains Mono',monospace" fontSize="8.5" fill="rgba(37,99,235,0.45)" letterSpacing=".1em">OUT C</text>
                <text x="1028" y="340" fontFamily="'JetBrains Mono',monospace" fontSize="8.5" fill="rgba(37,99,235,0.45)" letterSpacing=".1em">OUT D</text>
                <rect x="1022" y="55"  width="150" height="40" rx="8" fill="rgba(37,99,235,0.05)" stroke="rgba(37,99,235,0.18)" strokeWidth="1"/>
                <rect x="1022" y="120" width="150" height="40" rx="8" fill="rgba(37,99,235,0.05)" stroke="rgba(37,99,235,0.18)" strokeWidth="1"/>
                <rect x="1022" y="280" width="150" height="40" rx="8" fill="rgba(37,99,235,0.05)" stroke="rgba(37,99,235,0.18)" strokeWidth="1"/>
                <rect x="1022" y="345" width="150" height="40" rx="8" fill="rgba(37,99,235,0.05)" stroke="rgba(37,99,235,0.18)" strokeWidth="1"/>
                <line x1="1172" y1="60"  x2="1172" y2="90"  stroke="rgba(37,99,235,0.55)" strokeWidth="2" strokeLinecap="round"/>
                <line x1="1172" y1="125" x2="1172" y2="155" stroke="rgba(37,99,235,0.55)" strokeWidth="2" strokeLinecap="round"/>
                <line x1="1172" y1="285" x2="1172" y2="315" stroke="rgba(37,99,235,0.55)" strokeWidth="2" strokeLinecap="round"/>
                <line x1="1172" y1="350" x2="1172" y2="380" stroke="rgba(37,99,235,0.55)" strokeWidth="2" strokeLinecap="round"/>
                <text x="1040" y="80"  fontFamily="'JetBrains Mono',monospace" fontSize="13" fill="rgba(37,99,235,0.8)">≈</text>
                <text x="1040" y="145" fontFamily="'JetBrains Mono',monospace" fontSize="13" fill="rgba(37,99,235,0.8)">⊿</text>
                <text x="1040" y="305" fontFamily="'JetBrains Mono',monospace" fontSize="13" fill="rgba(37,99,235,0.8)">☑</text>
                <text x="1040" y="370" fontFamily="'JetBrains Mono',monospace" fontSize="13" fill="rgba(37,99,235,0.8)">☰</text>
                <text x="1062" y="79"  fontSize="13" fill="rgba(14,17,32,0.75)">ACCS 점수</text>
                <text x="1062" y="144" fontSize="13" fill="rgba(14,17,32,0.75)">XAI 근거</text>
                <text x="1062" y="304" fontSize="13" fill="rgba(14,17,32,0.75)">검증 결과</text>
                <text x="1062" y="369" fontSize="13" fill="rgba(14,17,32,0.75)">분석 리포트</text>
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* SCORING */}
      <section className="snap" id="s6">
        <div className="inner">
          <span className="slabel rv">Scoring System</span>
          <h2 className="sec-h rv d1">세 채널을 교차해<br /><span className="hl">ACCS를 산출합니다</span></h2>
          <p className="sec-sub rv d2">
            키워드 매칭이 아닌 온톨로지 기반 동적 가중치 모델 — 근거가 강한 채널일수록 최종 점수에 더 많이 반영됩니다.
          </p>
          <div className="feat-grid">
            <div className="fcard rv">
              <p className="fcard-num">CHANNEL 01 · TES</p>
              <div className="fcard-score-bar">
                <span className="fcard-score-label">Technical Evidence Score</span>
                <div className="fcard-bar"><div className="fcard-bar-fill" style={{ width: "40%" }} /></div>
              </div>
              <h3 className="fcard-t">기술 근거 점수</h3>
              <p className="fcard-d">특허청(KIPRIS)의 AI 관련 특허 출원·등록 여부와 DART 전자공시의 기술 개발 이력을 분석합니다. 실제 R&amp;D 근거 없는 AI 주장을 검증합니다.</p>
              <div className="ftags">
                <span className="ftag">KIPRIS 특허</span><span className="ftag">DART 공시</span><span className="ftag">가중치 40%</span>
              </div>
            </div>
            <div className="fcard rv d1">
              <p className="fcard-num">CHANNEL 02 · HES</p>
              <div className="fcard-score-bar">
                <span className="fcard-score-label">Horizontal Evidence Score</span>
                <div className="fcard-bar"><div className="fcard-bar-fill" style={{ width: "35%" }} /></div>
              </div>
              <h3 className="fcard-t">수평 인증 점수</h3>
              <p className="fcard-d">KC 인증 DB와 전파인증(RRA) 데이터베이스에서 제품·모델 단위 인증 여부를 직접 조회합니다. 공인 기관의 확정적 판단을 근거로 삼습니다.</p>
              <div className="ftags">
                <span className="ftag">KC 인증</span><span className="ftag">전파인증 RRA</span><span className="ftag">가중치 35%</span>
              </div>
            </div>
            <div className="fcard rv d2">
              <p className="fcard-num">CHANNEL 03 · CES</p>
              <div className="fcard-score-bar">
                <span className="fcard-score-label">Contextual Evidence Score</span>
                <div className="fcard-bar"><div className="fcard-bar-fill" style={{ width: "25%" }} /></div>
              </div>
              <h3 className="fcard-t">맥락 신뢰도 점수</h3>
              <p className="fcard-d">TIPA·KORAIA·GS·NEP·조달청 MAS 등 5개 기관 DB에서 기업의 AI 기술 공인 이력을 확인합니다. 제품 외부의 기관 신뢰도를 보완 근거로 활용합니다.</p>
              <div className="ftags">
                <span className="ftag">TIPA</span><span className="ftag">KORAIA</span><span className="ftag">GS·NEP·조달청</span><span className="ftag">가중치 25%</span>
              </div>
            </div>
          </div>
          <div className="accs-banner rv d3">
            <div className="accs-formula">
              <span className="accs-part">TES<em>×w₁</em></span>
              <span className="accs-op">+</span>
              <span className="accs-part">HES<em>×w₂</em></span>
              <span className="accs-op">+</span>
              <span className="accs-part">CES<em>×w₃</em></span>
              <span className="accs-op">=</span>
              <span className="accs-result">ACCS</span>
            </div>
            <p className="accs-note">w₁·w₂·w₃는 근거 강도에 따라 softmax로 동적 결정됩니다</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="snap" id="s7">
        <div className="cta-inner">
          <h2 className="cta-h rv d1">제품 신뢰도를<br /><span className="g">지금 바로 확인하세요</span></h2>
          <p className="cta-sub rv d2">다나와 상품 URL 하나만 있으면 됩니다.</p>
          <div className="rv d3" style={{ display: "flex", justifyContent: "center" }}>
            <button
              className="btn-p"
              style={{ padding: "14px 40px", fontSize: "14px" }}
              onClick={goStart}
            >
              분석 시작하기 →
            </button>
          </div>
          <p className="rv d4" style={{ marginTop: "20px", fontSize: "12px", color: "rgba(14,17,32,.32)", letterSpacing: ".01em" }}>
            TES · HES · CES 세 채널 교차 검증 · 온톨로지 기반
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="foot">
        <span className="ft-logo">Fides</span>
        <div className="ft-links">
          <span className="ft-link" onClick={() => document.getElementById("s1")?.scrollIntoView({ behavior: "smooth" })}>Home</span>
          <span className="ft-link" onClick={() => document.getElementById("slogos")?.scrollIntoView({ behavior: "smooth" })}>Data</span>
          <span className="ft-link" onClick={() => document.getElementById("s3")?.scrollIntoView({ behavior: "smooth" })}>Problem</span>
          <span className="ft-link" onClick={() => document.getElementById("s5")?.scrollIntoView({ behavior: "smooth" })}>Pipeline</span>
          <span className="ft-link" onClick={() => document.getElementById("s6")?.scrollIntoView({ behavior: "smooth" })}>Scoring</span>
          <span className="ft-link" onClick={() => document.getElementById("s7")?.scrollIntoView({ behavior: "smooth" })}>Get Started</span>
        </div>
        <span className="ft-mono">AI Reliability Analysis · 2025</span>
      </footer>
    </div>
  );
}
