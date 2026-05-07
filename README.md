<!-- 이건 저번에 프레젠테이션용 코드를 기반으로 ai가 만들어준거라서 그냥 전체 시스템이 어떻게 돌아가고 있는지 파악 용도로만 보면 될거 같아요 -->

<!-- # Fides

온톨로지 기반 AI 주장 신뢰도 검증 시스템.  
다나와 상품 URL을 입력하면 상품 정보를 자동 수집하고, OCR·정규화·외부 근거 수집을 거쳐 8종 온톨로지 기반으로 AI 주장의 신뢰도(ACCS)를 분석합니다.

---

## 핵심 목적

- 상품 설명에서 실제로 어떤 AI 기능(capability)이 주장되는지 추출
- 해당 기능의 필수/선택 요구요소(requirement)가 근거로 충족되는지 판정
- 수집 근거가 제품 수준인지, 회사 수준인지, 모델 수준인지 구분
- 모호 표현·혼동 표현·과장 표현 감점
- 최종 AI 주장 신뢰도(ACCS) 산출

---

## 폴더 구조

```
project_root/
├── server.py                  # FastAPI 메인 서버, 전체 파이프라인 오케스트레이션
├── analysis_engine.py         # 온톨로지 기반 분석 엔진 (ACCS 산출)
├── config.py                  # API 키 모음 (.gitignore 적용, 절대 커밋 금지)
├── company_map.json           # 회사명 정규화 사전 (실행 중 자동 누적)
├── koraia_list.txt            # KORAIA 인증 기업 화이트리스트 (수동 관리)
├── pipeline_test.py           # 파이프라인 단독 테스트 스크립트
├── static/
│   └── index.html             # 프론트엔드 단일 파일 (SPA)
├── logic/
│   ├── crawler.py             # 다나와 Selenium 크롤러
│   ├── ocr_analyzer.py        # Gemini Vision OCR
│   ├── normalizer.py          # 회사명/모델번호 정규화
│   ├── llm_resolver.py        # Gemini 기반 법인명 역추적 (DB 캐시 비활성화 상태)
│   ├── patent_scraper.py      # KIPRIS 특허 검색
│   ├── dart_scraper.py        # DART 공시 분석 (선택적 연동)
│   ├── import_cert_db.py      # GS/NEP 인증 DB 초기 적재 스크립트 (1회 실행)
│   └── api.py                 # RRA DB 검색 전용 FastAPI 앱 (별도 실행)
└── ontology/
    ├── ai_capability_master.csv
    ├── capability_requirement_master.csv
    ├── capability_scoring_rule_master.csv
    ├── confusion_rule_master.csv
    ├── evidence_pattern_master.csv
    ├── negative_pattern_master.csv
    ├── requirement_evidence_map_master.csv
    └── source_credibility_master.csv
```

---

## 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| 웹 프레임워크 | FastAPI + uvicorn |
| 언어 | Python 3.10+ |
| DB | MySQL 8.x (로컬) |
| ORM / DB 접근 | SQLAlchemy + pandas.read_sql |
| 크롤링 | Selenium + undetected-chromedriver + webdriver-manager |
| OCR | Gemini 2.0 Flash Vision (이미지 → 텍스트) |
| OCR 전처리 | OpenCV (cv2) — 리사이즈/JPEG 압축 |
| LLM 법인명 추적 | Gemini 2.5 Flash + Google Search grounding |
| LLM OCR 정제 | Gemini 2.5 Flash |
| DART 분석 | Gemini 2.0 Flash + OpenDartReader |
| 데이터 처리 | pandas |
| 스트리밍 | SSE (Server-Sent Events) |
| 설정 관리 | config.py (로컬 전용, .gitignore 적용) |

### 외부 API

| API | 용도 | 키 위치 |
|-----|------|---------|
| 공공데이터포털 (data.go.kr) | 조달청·TIPA 조회 | `DATA_GO_KR_KEY` |
| KIPRIS | 특허 검색 | `KIPRIS_KEY` |
| Google Gemini | OCR·법인명·DART 분석 | `GEMINI_KEY` / `GEMINI_API_KEY` |
| Open DART | 기업 공시 조회 | `DART_API_KEY` |
| 공공데이터포털 (odcloud.kr) | GS/NEP 인증 DB 적재 | `OPEN_DATA_KEY` |

---

## 데이터베이스

DB: `mysql+pymysql://root:1234@localhost:3306/CapstonDesign` (config.py에서 변경 가능)

### 테이블 목록

#### `kc_ai_products` — KC/전파인증 제품 DB
| 컬럼 | 설명 |
|------|------|
| `company_name` | 업체명 |
| `equip_name` | 기기명 |
| `model_name` | 모델명 |
| `cert_no` | 인증번호 |

> KC 전파인증 데이터는 별도 수집 후 직접 적재 필요.

#### `cert_products` — GS/NEP/NET 인증 DB
`logic/import_cert_db.py`를 **1회 실행**하여 공공데이터포털에서 적재.

| 컬럼 | 설명 |
|------|------|
| `cert_type` | 인증 구분 (GS인증 / NEP / NET 등) |
| `cert_no` | 인증 번호 |
| `product_name` | 인증 제품명 |
| `company_name` | 업체명 |
| `biz_no` | 사업자등록번호 |
| `representative` | 대표자 |
| `cert_date` | 인증일자 |
| `expire_date` | 만료일자 |

#### `rra` — 전파연구원(RRA) 제품 DB
`logic/api.py`의 `/api/search` 엔드포인트로 검색. 별도 FastAPI 앱으로 구동 가능.

| 컬럼 | 설명 |
|------|------|
| `company_name` | 상호명 |
| `equip_name` | 기기명 |
| `model_name` | 모델명 |
| `cert_no` | 인증번호 |

---

## 8개 온톨로지 파일

| 파일 | 역할 |
|------|------|
| `ai_capability_master.csv` | AI 기능 표준 사전 (capability_id, 한글명, 정의, 구분 기준) |
| `capability_requirement_master.csv` | 각 capability를 성립시키는 required / optional requirement 목록 |
| `capability_scoring_rule_master.csv` | capability별 점수 가중치, 임계값, 패널티/보너스 규칙 |
| `confusion_rule_master.csv` | 혼동되기 쉬운 capability 쌍 구분 규칙 (예: 얼굴감지 ≠ 얼굴인식) |
| `evidence_pattern_master.csv` | capability 주장 탐지 텍스트 패턴 (strong / weak 구분) |
| `negative_pattern_master.csv` | 과장·모호·오인 유발 표현 감점 패턴 및 penalty_weight |
| `requirement_evidence_map_master.csv` | requirement ↔ 허용 출처(source) 매핑 및 scope/base_weight |
| `source_credibility_master.csv` | 출처별 공신력·직접성·최신성 가중치 (kc 0.95 ~ seller_page 낮음) |

---

## 분석 파이프라인 (7단계)

```
URL 입력
 │
 ▼
[1] 크롤링 (crawler.py)
    Selenium으로 다나와 상품명·스펙표·상세 이미지 스크린샷 수집
 │
 ▼
[2] OCR (ocr_analyzer.py)
    Gemini 2.0 Flash Vision으로 상세 이미지에서 텍스트 추출
 │
 ▼
[3] Gemini 텍스트 정제 (server.py: clean_ocr_text_with_gemini)
    OCR 텍스트 정제 + 회사명·모델명 1차 추출
 │
 ▼
[4] 정규화 (normalizer.py + llm_resolver.py)
    회사명 4단계 우선순위 추출, 모델번호 정규식 추출
    Gemini 2.5 Flash + Google Search로 실제 법인명 역추적
 │
 ▼
[5] 병렬 근거 수집 (ThreadPoolExecutor, 5 workers)
    ├── KC DB 검색 (kc_ai_products, 4단계 fallback)
    ├── 조달청 쇼핑몰 API
    ├── TIPA 제조AI 솔루션 기업 API
    ├── KORAIA 화이트리스트
    └── GS/NEP 인증 DB (cert_products)
 │
 ▼
[6] 특허 검색 (patent_scraper.py)
    KIPRIS API — 1차: '인공지능 {카테고리}', 2차 fallback: '인공지능'
    alias별 최대 건수 채택
 │
 ▼
[7] 온톨로지 분석 (analysis_engine.py)
    capability별 점수 계산 → HES / TES / CES / ECS → ACCS 산출
    SSE로 진행 상황 및 최종 결과 스트리밍
```

---

<!-- ## 점수 체계

### Capability Score (각 AI 기능별 점수)

| 구성 요소 | 비중 | 설명 |
|-----------|------|------|
| base_claim_score | 45% | strong/weak 패턴 매칭 기반 주장 강도 |
| req_component_score | 55% | required 충족률 × 가중치 + optional 충족률 × 가중치 + 출처 품질 |
| confusion_penalty | 감점 | negative 패턴 탐지 시 penalty_weight 비례 차감 |
| company_only_penalty | 감점 | 근거가 회사 수준에만 머물 때 차감 |
| scope_bonus | 가산 | product/model 수준 근거 확인 시 가산 | -->

<!-- ### 채널별 종합 점수

| 점수 | 출처 채널 | 설명 |
|------|-----------|------|
| **HES** | kc, rra | Hardware Evidence Score — 하드웨어 실체 근거 |
| **TES** | kipris, dart | Technical Evidence Score — 기술적 근거 (특허·공시) |
| **CES** | tipa, koraia, gs, nep, procurement | Certification Evidence Score — 공인 인증 채널 |
| **ECS** | HES·TES·CES 채널 존재 여부 | Evidence Coverage Score — 근거 채널 다양성 (0·1/3·2/3·1) | -->


## API 명세

서버 기본 주소: `http://127.0.0.1:8000`

### `POST /api/analyze` — 분석 요청

```json
// 요청
{ "url": "https://prod.danawa.com/info/?pcode=..." }

// 응답
{ "task_id": "6ef4a1b2-..." }
```

### `GET /api/stream/{task_id}` — SSE 진행 스트리밍

진행 이벤트 예시:
```
data: {"type":"progress","stage":"crawl","message":"상품 페이지 크롤링 중"}
data: {"type":"progress","stage":"ocr","message":"OCR 분석 중"}
data: {"type":"progress","stage":"search","message":"외부 근거 병렬 검색 중"}
data: {"type":"progress","stage":"analysis","message":"온톨로지 기반 분석 중"}
```

최종 결과 이벤트:
```json
{
  "type": "result",
  "data": {
    "product_name": "예시 상품",
    "company_name": "예시 회사",
    "model_name": "MODEL-01",
    "verdict": "추가 검토 필요",
    "risk_level": "중간",
    "ontology_scores": {
      "accs": 71.2, "raw_accs": 76.4,
      "hes": 65.0, "tes": 74.5, "ces": 68.0, "ecs": 66.7, "conf": 72.3
    },
    "top_capabilities": [
      { "capability_id": "CAP_OBJECT_DETECTION", "capability_name_ko": "객체 감지", "final_score": 81.0 }
    ],
    "verification": {
      "kc":     { "ok": true,  "detail": "업체명 / 모델명 — 인증번호 ..." },
      "jodale": { "status": "등록됨", "cls": "pass" },
      "tipa":   { "status": "인증기업", "cls": "pass" },
      "koraia": { "status": "미등록",  "cls": "fail" },
      "gs":     { "count": 2, "cls": "pass" },
      "patent": { "count": 14, "cls": "pass" }
    }
  }
}
```

### `GET /api/result/{task_id}` — 결과 직접 조회

```json
{ "done": true, "result": { ... }, "event_count": 12 }
```

---

## 추가 실행 파일

### `logic/api.py` — RRA DB 검색 API (별도 FastAPI 앱)

```bash
uvicorn logic.api:app --port 8001
```

RRA 테이블을 회사명·기기명·모델명으로 복합 검색하는 전용 API.  
쉼표로 여러 키워드 OR 검색 가능. `format=text` 파라미터로 텍스트 출력 지원.

```
GET /api/search?company=삼성&equip=카메라&model=SM-R640
GET /api/search?company=삼성,LG&format=text
```

### `logic/import_cert_db.py` — 인증 DB 초기 적재 (1회 실행)

```bash
python logic/import_cert_db.py
```

공공데이터포털에서 GS/NEP/NET 인증 데이터를 수집해 `cert_products` 테이블에 적재.  
실행 시 기존 데이터를 TRUNCATE 후 전체 교체. 인증 데이터 갱신 시 재실행.

---

## 설치 및 실행

### 1. 패키지 설치

```bash
pip install fastapi uvicorn pandas sqlalchemy pymysql requests \
            google-genai opencv-python numpy \
            selenium undetected-chromedriver webdriver-manager \
            OpenDartReader
```

### 2. config.py 설정

```python
# config.py (절대 커밋 금지 — .gitignore 적용됨)
OPEN_DATA_KEY   = "공공데이터포털_일반인증키"
KIPRIS_KEY      = "KIPRIS_API_키"
GEMINI_KEY      = "Gemini_API_키 (OCR용)"
GEMINI_API_KEY  = "Gemini_API_키 (법인명·DART 분석용)"
DATA_GO_KR_KEY  = "공공데이터포털_인증키 (조달청·TIPA용)"
# DART_API_KEY  = "DART_키 (선택)"
```

### 3. DB 준비

```bash
# MySQL에서 데이터베이스 생성
CREATE DATABASE CapstonDesign CHARACTER SET utf8mb4;

# GS/NEP 인증 데이터 적재 (1회)
python logic/import_cert_db.py

# kc_ai_products, rra 테이블은 별도 데이터 수집 후 직접 적재
```

### 4. 서버 실행

```bash
uvicorn server:app --reload
# 접속: http://127.0.0.1:8000
```

---

## 주의사항

1. **llm_resolver.py의 DB 캐시는 현재 비활성화 상태**입니다. 매 요청마다 Gemini API를 호출합니다.  
   DB 캐시를 활성화하려면 `brand_resolver_cache` 테이블 생성 및 주석 해제가 필요합니다.

2. **DART 연동은 기본 비활성화**입니다. `server.py`의 `analyze_feature_scraper_bundle` 호출 시 `dart_result=None`으로 전달됩니다.

3. **KORAIA 인증**은 API 미지원으로 `koraia_list.txt` 화이트리스트 파일을 수동 관리합니다.

4. 점수 가중치와 판정 임계값은 baseline 수치입니다. 실제 상품 테스트 후 `capability_scoring_rule_master.csv`를 튜닝하세요.

5. 회사 수준 근거(특허·DART)만 있고 제품/모델 수준 근거가 없으면 `company_only_penalty`가 적용됩니다.

---

## 한 줄 요약

Fides는 단순 키워드 탐지가 아니라, **온톨로지 기반으로 AI 기능 주장과 근거의 충분성을 비교해 ACCS를 산출하는 분석 시스템**입니다. -->
