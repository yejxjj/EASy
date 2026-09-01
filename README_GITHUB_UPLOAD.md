# Fides 외부근거 연결 패치 (GitHub 웹 업로드용)

기준: GitHub `bug-fix` 브랜치의 현재 로직 구조.

## GitHub에서 교체할 파일

저장소 루트:
- `analysis_engine.py` — 전체 교체
- `pipeline_main.py` — 전체 교체

`logic/` 폴더:
- `logic/api.py` — 전체 교체
- `logic/patent_scraper.py` — 전체 교체

선택(권장):
- `tests/test_external_evidence_pipeline.py` — 신규 추가

## 핵심 수정

1. KIPRIS 검색 결과를 요약문 1개로 축약하지 않고 실제 특허 레코드 목록(`records`)으로 유지.
2. 특허 제목, 초록(응답에 존재하는 경우), 출원번호/일련번호, 출원인, 출원일, 등록상태, 검색유형을 전달.
3. `pipeline_main.py`가 KIPRIS `records`를 그대로 DataFrame으로 만들어 분석 엔진에 전달.
4. 숫자 `score=0`이어도 실제 `records`/`evidence`가 존재하는 외부 API 결과를 버리지 않음.
5. `analysis_engine.py`가 `발명의명칭(한글)`, `출원번호`, `일련번호`, `출원일자`를 정상 필드로 인식.
6. 판매 상세페이지(`seller_page`)를 TES의 외부 기술근거로 계산하지 않음. 상세페이지는 AI claim 및 일부 HES 입력으로 유지.
7. 관련 회사 특허는 capability 관련성이 확인될 때 `company_capability` 간접근거로 승격되고, 관련 없는 회사 특허는 audit만 남고 TES에 기여하지 않음.
8. KIPRIS 동일 검색을 연속 두 번 호출하던 중복 요청 제거. 정밀 검색 1회, 결과가 0건일 때만 fallback 1회.
9. NIPA/조달 결과도 가능한 경우 실제 원본 레코드를 함께 보존하도록 개선.

## 테스트

실행:

```bash
python -m py_compile analysis_engine.py fides_integration.py pipeline_main.py logic/api.py logic/patent_scraper.py
python -m unittest discover -s tests -v
```

검증 결과: 25개 테스트 모두 통과.

주요 검증 항목:
- KIPRIS 실제 레코드가 API → pipeline → analysis engine까지 유지되는지
- KIPRIS 한글 필드가 title/id/date로 정상 정규화되는지
- 관련 LLM/생성형AI 회사 특허가 TES를 올리는지
- 관련 없는 회사 특허는 TES를 올리지 않는지
- 동일 특허가 중복 검색돼도 1건으로 dedup 되는지
- 정확한 모델명이 특허에 포함되면 `direct_model`이 되는지
- DART 관련 텍스트는 TES에 기여하고 무관한 DART 텍스트는 기여하지 않는지
- `score=0`이어도 실제 records가 있으면 pipeline이 버리지 않는지
- KIPRIS 동일 요청이 2번 발생하지 않는지
- NIPA 매칭 레코드의 기술 상세가 보존되는지

## 합성 LG 그램 시나리오 결과

동일 claim 입력에 외부근거만 바꿔 비교:

- seller page만: HES 19.40 / TES 0 / ECS 0 / ACCS 16.49
- 관련 회사 LLM 특허 1건: HES 19.40 / TES 32.41 / ECS 33.75 / ACCS 26.87
- 관련 없는 회사 기계 특허 1건: HES 19.40 / TES 0 / ECS 0 / ACCS 16.49
- 모델명이 정확히 포함된 LLM 특허 1건: HES 19.40 / TES 64.44 / ECS 33.75 / ACCS 43.39

위 값은 실제 KIPRIS/DART 서버 호출 결과가 아니라 테스트용 합성 evidence로 데이터 경로와 판정 로직을 검증한 값입니다.
실제 `run_benchmark.py` 결과는 당시 기관 API 응답, DB, 크롤링/OCR 결과에 따라 달라집니다.
