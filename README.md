# Fides

온톨로지 기반 상품 설명 충분성 검증 시스템입니다.  
다나와 상품 URL을 입력하면 상품 정보를 수집하고, OCR 및 정규화를 거친 뒤, 외부 근거 데이터와 8종 온톨로지를 기반으로 AI 주장 신뢰도를 분석합니다.

## 핵심 목적

Fides는 상품 소개 페이지의 AI 관련 주장에 대해 다음을 판단하는 것을 목표로 합니다.

- 상품이 실제로 어떤 AI 기능(capability)을 주장하는지
- 그 기능을 뒷받침하는 필수/선택 요구요소(requirement)가 충분히 충족되는지
- 수집된 증거가 제품 수준인지, 기업 수준인지, 모델 수준인지
- 모호한 표현, 혼동 표현, 과장 표현이 포함되어 있는지
- 최종적으로 해당 주장이 얼마나 신뢰 가능한지

---

## 시스템 구성

### 1. 수집 파이프라인
`server.py`가 전체 수집 흐름을 담당합니다.

주요 단계:
1. 다나와 URL 검증
2. 상품 정보 크롤링
3. 상세 이미지 OCR
4. Gemini 기반 텍스트 정제
5. 제조사/모델명 정규화
6. 외부 근거 수집
   - KC / RRA DB
   - 조달청
   - TIPA
   - KORAIA
   - 특허(KIPRIS)
   - 인증(GS/NEP 등)
   - 필요 시 DART
7. `analysis_engine.py` 호출
8. SSE(Server-Sent Events)로 진행 상황과 결과 반환

### 2. 분석 엔진
`analysis_engine.py`가 온톨로지 기반 분석을 담당합니다.

주요 역할:
- capability 추출
- strong / weak pattern 매칭
- negative / confusion pattern 감점
- requirement 충족률 계산
- source 신뢰도 반영
- capability 점수 계산
- HES / TES / CES / ECS / CONF / ACCS 계산
- 최종 판정 및 위험도 산출

---

## 폴더 구조

```text
project_root/
├─ server.py
├─ analysis_engine.py
├─ config.py
├─ requirements.txt
├─ static/
│  └─ index.html
├─ logic/
│  ├─ crawler.py
│  ├─ ocr_analyzer.py
│  ├─ normalizer.py
│  ├─ llm_resolver.py
│  ├─ patent_scraper.py
│  ├─ tipa_api.py
│  ├─ koraia.py
│  ├─ jodale_api.py
│  └─ ...
└─ ontology/
   ├─ ai_capability_master.csv
   ├─ capability_requirement_master.csv
   ├─ confusion_rule_master.csv
   ├─ evidence_pattern_master.csv
   ├─ requirement_evidence_map_master.csv
   ├─ source_credibility_master.csv
   ├─ negative_pattern_master.csv
   └─ capability_scoring_rule_master.csv
```

---

## 8개 온톨로지 파일 설명

### 1) `ai_capability_master.csv`
AI 기능(capability)의 표준 사전입니다.

예:
- 객체 감지
- 사람 감지
- 얼굴 인식
- 음성 인식
- 화자 인식
- 이상 탐지
- 행동 분석
- 추천
- 경로 계획 및 장애물 회피

### 2) `capability_requirement_master.csv`
각 capability를 성립시키는 required / optional requirement를 정의합니다.

예:
- 객체 감지 → 카메라 센서(required), 객체 감지 모델(required)
- 얼굴 인식 → 얼굴 검출, 등록 사용자 식별, 매칭 로직 등

### 3) `confusion_rule_master.csv`
서로 혼동되기 쉬운 기능을 구분하기 위한 규칙입니다.

예:
- 얼굴 감지 ≠ 얼굴 인식
- 움직임 감지 ≠ 사람 감지
- 인기순 정렬 ≠ 개인화 추천

### 4) `evidence_pattern_master.csv`
capability를 주장하는 strong / weak 텍스트 패턴 사전입니다.

예:
- “객체 감지”, “사물 인식”, “object detection”
- “스마트 비전”, “지능형 영상 분석”

### 5) `requirement_evidence_map_master.csv`
requirement를 어떤 source evidence로 확인할 수 있는지 연결하는 매핑표입니다.

예:
- 카메라 센서 → KC, RRA, seller_page
- 객체 감지 모델 → KIPRIS, DART, seller_page

### 6) `source_credibility_master.csv`
출처별 공신력, 직접성, 최신성 신뢰도를 정의합니다.

예:
- KC, RRA, DART, KIPRIS → 높음
- procurement, TIPA, KORAIA → 중간~중상
- seller_page, review → 낮음

### 7) `negative_pattern_master.csv`
모호한 표현, 과장 표현, 오인 유발 표현을 감점하기 위한 규칙입니다.

예:
- “스마트”, “자동”, “첨단”, “AI급”
- “움직임 감지”를 사람 감지처럼 포장하는 표현

### 8) `capability_scoring_rule_master.csv`
capability별 점수 계산 규칙입니다.

예:
- required fulfillment 비중
- optional bonus 비중
- strong / weak pattern 비중
- confusion penalty
- company-only penalty
- product/model bonus
- positive 판정 threshold

---

## 점수 체계

최종 점수는 다음 구조를 따릅니다.

- **HES**: Hardware Evidence Score  
  KC / RRA 등 하드웨어 실체 근거 기반 점수

- **TES**: Technical Evidence Score  
  특허 / DART 등 기술적 근거 기반 점수

- **CES**: Certification Evidence Score  
  TIPA / KORAIA / GS / NEP / 조달청 등 인증·공인 채널 기반 점수

- **ECS**: Evidence Coverage Score  
  확보된 근거 채널의 다양성과 coverage

- **CONF**: Confidence  
  분석 결과의 신뢰도

- **ACCS**: AI Claim Credibility Score  
  최종 AI 주장 신뢰도 점수

---

## 분석 흐름

1. 상품 설명, OCR 텍스트, 수집 결과를 통합해 claim text를 구성합니다.
2. `evidence_pattern_master.csv`를 이용해 capability 후보를 찾습니다.
3. `negative_pattern_master.csv`, `confusion_rule_master.csv`를 적용해 과대 인식과 혼동을 줄입니다.
4. `capability_requirement_master.csv`에서 capability별 required / optional requirement를 불러옵니다.
5. `requirement_evidence_map_master.csv`를 이용해 requirement와 source evidence를 매핑합니다.
6. `source_credibility_master.csv`를 이용해 source 품질을 반영합니다.
7. capability별 score를 계산합니다.
8. capability 결과를 바탕으로 HES / TES / CES / ECS / CONF / ACCS를 계산합니다.
9. 최종 verdict와 risk level을 반환합니다.

---

## 실행 환경

권장:
- Python 3.10+
- MySQL
- FastAPI
- pandas
- SQLAlchemy
- uvicorn
- Selenium
- EasyOCR
- Gemini API

---

## 설치

```bash
pip install -r requirements.txt
```

`requirements.txt`가 아직 정리되지 않았다면, 최소한 아래 패키지들이 필요합니다.

```bash
pip install fastapi uvicorn pandas sqlalchemy pymysql requests easyocr selenium google-genai
```

프로젝트 상황에 따라 추가 패키지가 필요할 수 있습니다.

---

## 설정

`config.py` 예시:

```python
DATA_GO_KR_KEY = "발급받은_공공데이터_API_KEY"
GEMINI_API_KEY = "발급받은_GEMINI_API_KEY"
DB_URL = "mysql+pymysql://root:1234@localhost:3306/CapstonDesign"
```

DB에는 최소한 아래와 유사한 테이블이 준비되어 있어야 합니다.

- `kc_ai_products`
- 인증 관련 테이블
- 필요 시 추가 근거 테이블

실제 테이블명은 프로젝트 코드에 맞게 확인해야 합니다.

---

## 서버 실행

```bash
uvicorn server:app --reload
```

기본 접속 예시:
- 메인 페이지: `http://127.0.0.1:8000/`
- 분석 요청: `POST /api/analyze`
- 진행 스트림: `GET /api/stream/{task_id}`

---

## API 개요

### 1) 분석 요청
`POST /api/analyze`

요청 예시:

```json
{
  "url": "https://prod.danawa.com/info/?pcode=..."
}
```

응답 예시:

```json
{
  "task_id": "6ef4..."
}
```

### 2) 진행 스트리밍
`GET /api/stream/{task_id}`

SSE 이벤트 예시:

```text
data: {"type":"progress","stage":"ocr","message":"OCR 분석 중"}
```

최종 결과 이벤트 예시:

```json
{
  "type": "result",
  "data": {
    "product_name": "예시 상품",
    "company_name": "예시 회사",
    "model_name": "MODEL-01",
    "ontology_scores": {
      "accs": 71.2,
      "raw_accs": 76.4,
      "hes": 65.0,
      "tes": 74.5,
      "ces": 68.0,
      "ecs": 66.7,
      "conf": 72.3
    },
    "ontology_verdict": "추가 검토 필요",
    "ontology_risk_level": "중간",
    "top_capabilities": [
      {
        "capability_id": "CAP_OBJECT_DETECTION",
        "capability_name_ko": "객체 감지",
        "final_score": 81.0
      }
    ],
    "ontology_reasons": [
      "강한 capability 주장이 확인되었습니다.",
      "필수 requirement 충족률이 높습니다."
    ]
  }
}
```

---

## 현재 설계 원칙

이 프로젝트는 **임시 테스트 점수 방식**이 아니라, **온톨로지 기반 분석 로직**을 최종 분석 엔진으로 사용합니다.

즉 아래 방식은 사용하지 않습니다.
- 단순히 evidence가 있으면 점수 부여
- 텍스트/검증/관계형 점수를 임의 평균
- 점수 범위에 따른 임시 위험도 매핑

대신 아래 구조를 사용합니다.
- capability 기반 주장 해석
- requirement 충족 여부 판정
- source 품질 반영
- confusion / negative rule 반영
- ontology rule 기반 최종 ACCS 산출

---

## 주의사항

1. 현재 점수 가중치와 threshold는 baseline입니다.  
   실제 상품 5~10개 이상으로 테스트하면서 튜닝해야 합니다.

2. 회사 수준 evidence와 제품/모델 수준 evidence는 다르게 취급해야 합니다.  
   따라서 단순히 특허가 있다는 이유만으로 제품 주장을 바로 인정하지 않습니다.

3. `seller_page` 텍스트는 strongest evidence가 아닙니다.  
   외부 공신력 evidence가 함께 있어야 합니다.

4. DART 연동은 프로젝트 상황에 따라 선택적으로 붙일 수 있습니다.

---

## 향후 보완 방향

- capability alias 정교화
- requirement 매핑 규칙 세분화
- 모델/제품/회사 scope 판정 정교화
- negative/confusion 패턴 확장
- 프런트 UI를 ontology 결과 중심으로 개편
- 샘플 데이터셋 기반 threshold 튜닝

---

## 한 줄 요약

Fides는 단순 키워드 탐지가 아니라, **온톨로지 기반으로 AI 기능 주장과 근거의 충분성을 비교해 ACCS를 산출하는 분석 시스템**입니다.
