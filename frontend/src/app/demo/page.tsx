"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Database,
  FileCheck2,
  FileSearch,
  Layers,
  LineChart,
  Plus,
  Puzzle,
  ScrollText,
  ShieldOff,
  Sparkles,
  Zap,
} from "lucide-react";

import "./demo.css";

const TRUST_SOURCES = [
  "특허청 KIPRIS · AI 관련 특허 출원/등록 이력",
  "DART 전자공시 · 연구개발 및 기술 투자 내역",
  "KC 인증 DB · 제품 단위 공인 인증 여부",
  "전파인증(RRA) · 무선/AI 기기 인증 데이터",
];

const WHY_FIDES = [
  "수동 검토 대비 10배 빠른 처리 속도",
  "근거 없는 'AI 탑재' 주장에 속지 않는 판단 기준",
  "온톨로지 기반의 표준화된 채점 로직",
  "TES · HES · CES 세 채널 교차 검증",
];

const FEATURES_TOP = [
  {
    icon: Layers,
    title: "온톨로지 기반 채점",
    desc: "키워드 매칭이 아닌 근거 강도로 동적 가중치를 산출합니다.",
  },
  {
    icon: ShieldOff,
    title: "허위 근거 없음",
    desc: "특허 · 인증 · 공시 데이터 없이는 신뢰 점수를 부여하지 않습니다.",
  },
  {
    icon: FileCheck2,
    title: "설득력 있는 리포트",
    desc: "소비자와 규제기관 모두 이해할 수 있는 근거 중심 리포트.",
  },
  {
    icon: Zap,
    title: "몇 분이면 충분",
    desc: "URL 하나로 크롤링부터 리포트까지 자동으로 완료됩니다.",
  },
];

const POSTS = [
  {
    cat: "가전 · TV",
    title: "OO전자 QNED AI 75형(벽걸이), 실제 AI 기능 근거는?",
    status: "done" as const,
    label: "완료",
  },
  {
    cat: "생활가전 · 로봇청소기",
    title: "로보킹 AI 올인원, 특허 기반 성능 검증",
    status: "progress" as const,
    label: "진행중",
  },
  {
    cat: "주방가전 · 냉장고",
    title: "AI 오브제컬렉션 냉장고, 공시 데이터로 확인",
    status: "done" as const,
    label: "완료",
  },
  {
    cat: "뷰티가전 · 홈캠",
    title: "AI 홈캠 감지 기능, 인증 여부 조회",
    status: "pending" as const,
    label: "대기",
  },
];

const MINI_FEATURES = [
  { icon: LineChart, text: "ACCS 점수 자동 산출" },
  { icon: ScrollText, text: "공유 가능한 리포트 링크" },
  { icon: ShieldOff, text: "허위 데이터 없음" },
  { icon: FileSearch, text: "PDF로 즉시 내보내기" },
];

const SCORES = [
  { name: "기술 근거 (TES)", value: 62 },
  { name: "수평 인증 (HES)", value: 78 },
  { name: "맥락 신뢰도 (CES)", value: 54 },
];

const COMPARE_ROWS: [string, string, string, string][] = [
  ["검증 방식", "담당자 수기 확인", "키워드 기반 자동 분류", "온톨로지 근거 교차 검증"],
  ["처리 속도", "제품당 1~2일", "수 초 (근거 없음)", "제품당 약 90초"],
  ["데이터 소스", "제조사 자료 의존", "웹 텍스트만 참고", "특허 · 인증 · 공시 4종 이상"],
  ["결과 형식", "내부 메모", "단순 위험도 라벨", "XAI 근거 포함 리포트"],
  ["신뢰도", "검토자 역량에 좌우", "오탐 다수 발생", "표준화된 ACCS 점수"],
  ["최초 결과까지", "요청 후 수일", "즉시 (근거 불명확)", "즉시 + 근거 명시"],
];

const PRICING = [
  {
    name: "Free",
    monthly: 0,
    annual: 0,
    desc: "개인 사용자, 가볍게 시작하기",
    features: ["월 5회 분석", "기본 리포트 열람", "커뮤니티 지원"],
    featured: false,
  },
  {
    name: "Pro",
    monthly: 89000,
    annual: 71000,
    desc: "팀 단위 상시 모니터링",
    features: [
      "무제한 분석",
      "TES · HES · CES 상세 리포트",
      "PDF 내보내기 & 공유 링크",
      "API 연동",
    ],
    featured: true,
  },
  {
    name: "Enterprise",
    monthly: null,
    annual: null,
    desc: "대규모 카탈로그, 전용 SLA",
    features: [
      "커스텀 온톨로지 구축",
      "전담 데이터 엔지니어 지원",
      "온프레미스 배포 옵션",
      "SLA 및 감사 로그",
    ],
    featured: false,
  },
];

const AROUND_FEATURES = [
  { icon: Puzzle, title: "커스텀 온톨로지", desc: "산업군별 채점 규칙을 직접 설계합니다." },
  { icon: Database, title: "API 위젯", desc: "리포트를 사이트에 바로 임베드합니다." },
  { icon: FileSearch, title: "근거 검색", desc: "특허 · 인증 원문을 즉시 조회합니다." },
  { icon: ScrollText, title: "스키마 내보내기", desc: "구조화된 JSON/CSV로 결과를 추출합니다." },
];

const FAQS = [
  {
    q: "이 서비스는 다른 AI 탐지 도구와 무엇이 다른가요?",
    a: "대부분의 도구는 텍스트 키워드만 분석하지만, Fides는 특허청·전자공시·인증 DB 등 실제 공공 데이터를 교차 검증해 근거 기반으로 점수를 산출합니다.",
  },
  {
    q: "데이터는 어디서 가져오나요?",
    a: "KIPRIS 특허, DART 전자공시, KC 인증, 전파인증(RRA), TIPA, KORAIA, GS·NEP 인증 등 공신력 있는 공공·인증 기관 데이터베이스를 실시간으로 조회합니다.",
  },
  {
    q: "분석에는 얼마나 걸리나요?",
    a: "제품 URL 하나 기준 평균 60~90초 내에 크롤링부터 최종 리포트까지 자동으로 완료됩니다.",
  },
  {
    q: "점수는 어떻게 계산되나요?",
    a: "TES(기술 근거) · HES(수평 인증) · CES(맥락 신뢰도) 세 채널의 점수를 근거 강도에 따라 동적 가중치로 합산해 최종 ACCS를 산출합니다.",
  },
  {
    q: "API 연동이 가능한가요?",
    a: "Pro 플랜부터 REST API를 제공하며, 자체 서비스나 대시보드에 분석 결과를 바로 임베드할 수 있습니다.",
  },
  {
    q: "무료로 사용할 수 있나요?",
    a: "네, Free 플랜으로 월 5회까지 무료로 분석하고 기본 리포트를 확인할 수 있습니다.",
  },
];

function formatPrice(n: number | null) {
  if (n === null) return "문의";
  if (n === 0) return "무료";
  return `₩${n.toLocaleString("ko-KR")}`;
}

export default function DemoLandingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="dm">
      {/* NAV */}
      <nav className="dm-nav">
        <div className="dm-nav-inner">
          <div className="dm-logo">
            <span className="dm-logo-mark">F</span>
            Fides
          </div>
          <div className="dm-nav-links">
            <a className="dm-nav-link" href="#trust">
              제품
            </a>
            <a className="dm-nav-link" href="#pricing">
              가격
            </a>
            <a className="dm-nav-link" href="#faq">
              FAQ
            </a>
          </div>
          <div className="dm-nav-right">
            <Link className="dm-nav-link" href="/login">
              로그인
            </Link>
            <Link className="dm-btn-primary" href="/login?tab=register">
              무료로 시작 <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="dm-hero">
        <div className="dm-hero-inner">
          <span className="dm-eyebrow">
            <Sparkles size={12} /> AI 신뢰도 자동 검증 플랫폼
          </span>
          <h1>
            AI 워싱 탐지를
            <br />
            자동으로.
          </h1>
          <p>
            Fides는 제품 URL 하나로 특허 · 인증 · 공시 데이터를 교차 검증해
            AI 신뢰도를 자동으로 진단합니다.
          </p>
          <Link className="dm-btn-primary" href="/login?tab=register" style={{ padding: "13px 24px" }}>
            지금 분석 시작하기 <ArrowRight size={15} />
          </Link>
        </div>

        <div className="dm-preview-wrap">
          <div className="dm-preview">
            <span className="dm-preview-tag">
              <BadgeCheck size={12} /> Fides 분석 리포트 미리보기
            </span>
            <h3>이 제품의 AI 기능, 실제 근거가 있을까요? (그리고 확인하는 법)</h3>
            <p className="dm-preview-body">
              제품 상세페이지는 &ldquo;AI 최적화&rdquo;를 강조하지만, 특허청과
              전자공시 어디에도 관련 R&amp;D 이력이 없는 경우가 많습니다.
              Fides는 이런 간극을 자동으로 찾아내고, 어떤 데이터를 근거로
              판단했는지 그대로 보여줍니다.
            </p>
            <div className="dm-preview-meta">
              <span className="dm-preview-avatar" />
              Fides Engine · 2026.07.23
              <span className="dm-preview-score">ACCS 58</span>
            </div>
          </div>
          <div className="dm-preview-glow" />
        </div>
        <div className="dm-glow-divider" />
      </section>

      {/* TRUST SOURCES */}
      <section className="dm-section" id="trust">
        <div className="dm-container">
          <div className="dm-section-head center">
            <span className="dm-eyebrow">Why Trust Us</span>
            <h2 className="dm-h2">
              공시는 진짜를 가려냅니다.
              <br />
              Fides는 그 판단을 자동화합니다.
            </h2>
            <p className="dm-sub" style={{ marginTop: 14 }}>
              단순 텍스트 분석이 아닙니다. 국내 공인 인증 기관과 특허청 · 공시
              데이터를 실시간 교차 검증해 AI 신뢰성 여부를 판단합니다.
            </p>
          </div>

          <div className="dm-two-col">
            <div className="dm-info-card">
              <h4>AI가 신뢰를 어디서 얻는가</h4>
              <div className="dm-info-list">
                {TRUST_SOURCES.map((t) => (
                  <div className="dm-info-row" key={t}>
                    <Check size={15} />
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="dm-info-card">
              <h4>왜 Fides가 최선의 검증 방법인가</h4>
              <div className="dm-info-list">
                {WHY_FIDES.map((t) => (
                  <div className="dm-info-row" key={t}>
                    <Check size={15} />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dm-feat-grid-2">
            {FEATURES_TOP.map(({ icon: Icon, title, desc }) => (
              <div className="dm-feat-card" key={title}>
                <div className="dm-feat-icon">
                  <Icon size={17} />
                </div>
                <h5>{title}</h5>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* READS LIKE DATA */}
      <section className="dm-section">
        <div className="dm-container">
          <div className="dm-section-head">
            <span className="dm-eyebrow">In Action</span>
            <h2 className="dm-h2">리포트가 아니라, 근거처럼 보입니다.</h2>
            <p className="dm-sub" style={{ marginTop: 14 }}>
              Fides가 처리 중인 실제 분석 큐의 일부입니다. 카테고리, 진행
              상태, 근거 데이터까지 실시간으로 확인할 수 있습니다.
            </p>
          </div>

          <div className="dm-post-list">
            <div className="dm-post-head">
              <span>카테고리</span>
              <span>제품</span>
              <span>상태</span>
            </div>
            {POSTS.map((p) => (
              <div className="dm-post-row" key={p.title}>
                <span className="dm-post-cat">{p.cat}</span>
                <span className="dm-post-title">{p.title}</span>
                <span className={`dm-badge ${p.status}`}>{p.label}</span>
              </div>
            ))}
          </div>

          <div className="dm-mini-grid">
            {MINI_FEATURES.map(({ icon: Icon, text }) => (
              <div className="dm-mini-card" key={text}>
                <Icon size={15} />
                {text}
              </div>
            ))}
          </div>

          <div className="dm-style-panel">
            <div>
              <h4 style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 12 }}>
                Fides 리포트 톤
              </h4>
              <div className="dm-tone-pills">
                <span className="dm-tone-pill active">객관적 · 사실 중심</span>
                <span className="dm-tone-pill">간결형</span>
                <span className="dm-tone-pill">상세형</span>
              </div>
            </div>
            <p className="dm-style-preview">
              &ldquo;해당 제품은 KC 인증 DB에서 AI 관련 인증 이력이 확인되지
              않았으며, 특허청에도 대응 특허가 등록되어 있지 않습니다.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* GRADES ITSELF */}
      <section className="dm-section">
        <div className="dm-container">
          <div className="dm-grades">
            <div>
              <span className="dm-eyebrow">Scoring System</span>
              <h2 className="dm-h2" style={{ marginTop: 16 }}>
                모든 분석은
                <br />
                스스로 채점됩니다.
              </h2>
              <div className="dm-grades-list">
                <div className="dm-grades-item">
                  <span className="dm-grades-item-icon">
                    <BadgeCheck size={15} />
                  </span>
                  <div>
                    <h5>신뢰</h5>
                    <p>근거 강도에 따라 최종 점수가 자동으로 조정됩니다.</p>
                  </div>
                </div>
                <div className="dm-grades-item">
                  <span className="dm-grades-item-icon">
                    <FileCheck2 size={15} />
                  </span>
                  <div>
                    <h5>근거 충분성</h5>
                    <p>모든 판단에는 인용 가능한 원본 데이터가 따라붙습니다.</p>
                  </div>
                </div>
                <div className="dm-grades-item">
                  <span className="dm-grades-item-icon">
                    <Sparkles size={15} />
                  </span>
                  <div>
                    <h5>명확성</h5>
                    <p>전문 용어 없이 소비자가 바로 이해할 수 있게 씁니다.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="dm-score-panel">
              <div className="dm-score-top">
                <span className="label">종합 등급 · Medium</span>
                <span className="value">58</span>
              </div>
              {SCORES.map((s) => (
                <div className="dm-score-row" key={s.name}>
                  <span className="name">{s.name}</span>
                  <div className="dm-score-bar">
                    <div className="dm-score-bar-fill" style={{ width: `${s.value}%` }} />
                  </div>
                  <span className="num">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="dm-section">
        <div className="dm-container">
          <div className="dm-section-head center">
            <span className="dm-eyebrow">Compare</span>
            <h2 className="dm-h2">타사 검증 방식과 비교해보세요.</h2>
          </div>
          <div className="dm-compare">
            <table>
              <thead>
                <tr>
                  <th>항목</th>
                  <th>수동 검토</th>
                  <th>타사 AI 탐지 툴</th>
                  <th className="col-fides">Fides</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row[0]}>
                    <td>{row[0]}</td>
                    <td>{row[1]}</td>
                    <td>{row[2]}</td>
                    <td className="col-fides">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="dm-compare-note">
            확실하지 않다면? <Link href="/login">샘플 리포트 직접 보기 →</Link>
          </p>
        </div>
      </section>

      {/* PRICING */}
      <section className="dm-section" id="pricing">
        <div className="dm-container">
          <div className="dm-section-head center">
            <span className="dm-eyebrow">Pricing</span>
            <h2 className="dm-h2">
              무료로 시작하고,
              <br />
              필요할 때 업그레이드하세요.
            </h2>
          </div>

          <div style={{ textAlign: "center" }}>
            <div className="dm-toggle">
              <button
                className={billing === "monthly" ? "active" : ""}
                onClick={() => setBilling("monthly")}
              >
                월간 결제
              </button>
              <button
                className={billing === "annual" ? "active" : ""}
                onClick={() => setBilling("annual")}
              >
                연간 결제 (-20%)
              </button>
            </div>
          </div>

          <div className="dm-pricing-grid">
            {PRICING.map((plan) => (
              <div
                className={`dm-price-card ${plan.featured ? "featured" : ""}`}
                key={plan.name}
              >
                <div className="dm-price-name">{plan.name}</div>
                <div className="dm-price-amount">
                  {formatPrice(billing === "monthly" ? plan.monthly : plan.annual)}
                  {plan.monthly !== null && plan.monthly !== 0 && <span> / 월</span>}
                </div>
                <div className="dm-price-desc">{plan.desc}</div>
                <ul className="dm-price-list">
                  {plan.features.map((f) => (
                    <li key={f}>
                      <Check size={14} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link className="dm-price-cta" href="/login?tab=register">
                  {plan.name === "Enterprise" ? "문의하기" : "시작하기"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EVERYTHING AROUND */}
      <section className="dm-section">
        <div className="dm-container">
          <div className="dm-section-head center">
            <span className="dm-eyebrow">Everything Else</span>
            <h2 className="dm-h2">분석을 둘러싼 모든 것.</h2>
          </div>

          <div className="dm-around-grid">
            {AROUND_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div className="dm-feat-card" key={title}>
                <div className="dm-feat-icon">
                  <Icon size={17} />
                </div>
                <h5>{title}</h5>
                <p>{desc}</p>
              </div>
            ))}
          </div>

          <div className="dm-analytics-card">
            <div className="dm-analytics-stats">
              <div className="dm-analytics-stat">
                <div className="num">2,840</div>
                <div className="lbl">누적 분석 건수</div>
              </div>
              <div className="dm-analytics-stat">
                <div className="num">42</div>
                <div className="lbl">위험 탐지 건수</div>
              </div>
              <div className="dm-analytics-stat">
                <div className="num">24</div>
                <div className="lbl">활성 모니터링</div>
              </div>
            </div>
            <svg viewBox="0 0 300 80" width="100%" height="80" preserveAspectRatio="none">
              <polyline
                points="0,60 30,55 60,58 90,42 120,46 150,30 180,34 210,20 240,24 270,10 300,14"
                fill="none"
                stroke="#4ade80"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polygon
                points="0,60 30,55 60,58 90,42 120,46 150,30 180,34 210,20 240,24 270,10 300,14 300,80 0,80"
                fill="rgba(74,222,128,0.12)"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="dm-section" id="faq">
        <div className="dm-container">
          <div className="dm-section-head center">
            <span className="dm-eyebrow">FAQ</span>
            <h2 className="dm-h2">자주 묻는 질문</h2>
          </div>
          <div className="dm-faq">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div className={`dm-faq-item ${open ? "open" : ""}`} key={f.q}>
                  <button
                    className="dm-faq-q"
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    {f.q}
                    <Plus size={16} />
                  </button>
                  {open && <p className="dm-faq-a">{f.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="dm-cta">
        <h2>
          신뢰를 자동으로
          <br />
          증명하세요.
        </h2>
        <Link className="dm-btn-primary" href="/login?tab=register" style={{ padding: "13px 26px" }}>
          무료로 시작하기 <ArrowRight size={15} />
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="dm-footer">
        <div className="dm-container">
          <div className="dm-footer-top">
            <div className="dm-logo">
              <span className="dm-logo-mark">F</span>
              Fides
            </div>
            <div className="dm-footer-cols">
              <div className="dm-footer-col">
                <h6>제품</h6>
                <ul>
                  <li>
                    <a href="#trust">기능</a>
                  </li>
                  <li>
                    <a href="#pricing">가격</a>
                  </li>
                  <li>
                    <Link href="/dashboard">대시보드</Link>
                  </li>
                </ul>
              </div>
              <div className="dm-footer-col">
                <h6>리소스</h6>
                <ul>
                  <li>
                    <a href="#faq">FAQ</a>
                  </li>
                  <li>
                    <Link href="/history">분석 기록</Link>
                  </li>
                  <li>
                    <Link href="/compare">비교하기</Link>
                  </li>
                </ul>
              </div>
              <div className="dm-footer-col">
                <h6>회사</h6>
                <ul>
                  <li>
                    <Link href="/login">로그인</Link>
                  </li>
                  <li>
                    <Link href="/login?tab=register">회원가입</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="dm-footer-bottom">
            <span>© 2026 Fides. All rights reserved.</span>
            <span>AI Reliability Analysis</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
