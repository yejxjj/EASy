"""
dataset_builder.py — AI 워싱 벤치마크 데이터셋 자동 구축

Phase 1: 다나와 검색 → URL + 제품명 수집  (Selenium, 쿼리당 최대 40개)
Phase 2: 경량 상세 정보 추출               (Selenium, 스크린샷 없음)
  └─ AI 표기 필터: 제품명 OR 스펙에 AI/인공지능 없으면 제거
  └─ 결과를 CSV로 저장 (label 열 비워둠 → 수동 판별)

실행:
  python dataset_builder.py              # Phase 1 → Phase 2 전체
  python dataset_builder.py --recollect  # 기존 CSV URL로 Phase 2만 재실행 (스펙 재수집)
"""
import os
import sys
import json
import time
import re
import csv
import urllib.parse
import concurrent.futures
from datetime import datetime
from pathlib import Path

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# =====================================================================
# 설정
# =====================================================================
TARGET_URL_COUNT = 900       # 수집 목표 (필터 후 700개 확보 여유)
MAX_PER_QUERY    = 40        # 쿼리당 최대 수집 (카테고리 다양성)
MAX_WORKERS      = 1         # Selenium 워커 수 (chromedriver 충돌 방지)
OUTPUT_CSV       = "dataset/benchmark_dataset.csv"
CHECKPOINT_JSON  = "dataset/checkpoint.json"

# AI 표기 필터 패턴
AI_PATTERN = re.compile(r'AI|인공지능|A\.I', re.IGNORECASE)

# 국내 브랜드 화이트리스트 (제품명 첫 토큰 기준)
KOREAN_BRANDS: set[str] = {
    # 대기업
    "삼성전자", "LG전자", "LG",
    # 생활가전
    "쿠쿠전자", "쿠쿠", "위닉스", "코웨이", "청호나이스", "SK매직",
    "위니아", "대유위니아", "캐리어", "귀뚜라미", "경동나비엔",
    "신일", "한일전기", "린나이", "한경희",
    # IT/모니터
    "알파스캔", "크로스오버", "주연테크", "이노스", "스타리온",
    # 주변기기/IoT
    "앱코", "망고슬래브", "아이닉", "모바",
    # 보안/블랙박스
    "아이나비", "파인뷰", "뷰게라", "루카스", "팅크웨어",
    # 기타
    "바디프랜드", "세코",
}

def _is_korean_brand(product_name: str) -> bool:
    first = product_name.split()[0] if product_name else ""
    return first in KOREAN_BRANDS

# 검색 쿼리 — 가전/IT/생활 카테고리 다양성 확보
SEARCH_QUERIES = [
    # 컴퓨팅
    "AI 노트북", "AI 게이밍 노트북", "AI 올인원PC", "AI 태블릿", "AI 스마트폰",
    "AI 모니터", "AI 키보드", "AI 웹캠", "AI 프린터",
    # 가전 대형
    "AI 냉장고", "AI 세탁기", "AI 건조기", "AI 에어컨", "AI TV",
    "AI 식기세척기", "AI 전자레인지",
    # 가전 소형
    "AI 청소기", "AI 로봇청소기", "AI 공기청정기", "AI 가습기",
    "AI 정수기", "AI 선풍기", "AI 밥솥", "AI 에어프라이어",
    # 오디오/영상
    "AI 스피커", "AI 이어폰", "AI 헤드폰",
    # 보안/IoT
    "AI 카메라", "AI CCTV", "AI 보안카메라", "AI 홈캠", "AI 도어락",
    "AI 블랙박스",
    # 헬스/뷰티
    "AI 안마기", "AI 체중계", "AI 혈압계", "AI 칫솔",
    # 기타
    "AI 러닝머신", "AI 안마의자",
    # 인공지능 변형
    "인공지능 청소기", "인공지능 냉장고", "인공지능 스피커", "인공지능 카메라",
]


# =====================================================================
# Phase 1: URL 수집
# =====================================================================
def _get_search_driver() -> uc.Chrome:
    options = uc.ChromeOptions()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-gpu")
    options.add_argument("--lang=ko-KR")
    return uc.Chrome(options=options, version_main=148)


def _extract_pcodes_from_page(driver: uc.Chrome) -> list[tuple[str, str]]:
    """페이지 소스에서 pcode + 임시 제품명 추출"""
    time.sleep(1)
    source = driver.page_source
    results: list[tuple[str, str]] = []
    seen: set[str] = set()

    # JSON 형태: "pcode":123456
    candidates = re.findall(r'"pcode"\s*:\s*"?(\d{6,12})"?', source)
    # URL 형태: pcode=123456
    candidates += re.findall(r'pcode=(\d{6,12})', source)
    # 변형 키: productCode, productNo
    candidates += re.findall(r'"(?:productCode|productNo|prod_cd)"\s*:\s*"?(\d{6,12})"?', source)

    for pcode in dict.fromkeys(candidates):
        if pcode not in seen:
            seen.add(pcode)
            results.append((pcode, f"제품_{pcode}"))

    # prod.danawa.com href에서 추가 수집
    try:
        for elem in driver.find_elements(By.CSS_SELECTOR, "a[href*='prod.danawa.com']"):
            href = elem.get_attribute("href") or ""
            m = re.search(r"pcode=(\d+)", href)
            if m and m.group(1) not in seen:
                pcode = m.group(1)
                seen.add(pcode)
                name = elem.text.strip()
                results.append((pcode, name[:200] if len(name) >= 5 else f"제품_{pcode}"))
    except Exception:
        pass

    return results


def collect_urls_from_danawa(queries: list[str] = SEARCH_QUERIES) -> list[dict]:
    """다나와 검색 결과에서 제품 URL 수집 (쿼리당 MAX_PER_QUERY 제한)"""
    seen_pcodes: set[str] = set()
    products: list[dict] = []

    driver = _get_search_driver()
    try:
        driver.get("https://www.danawa.com/")
        time.sleep(3)
        print(f"  [초기화] 다나와 메인 접속 완료 (타이틀: {driver.title[:30]})")

        for query in queries:
            if len(products) >= TARGET_URL_COUNT:
                break
            print(f"\n🔍 수집 중: '{query}'")

            query_count = 0  # 쿼리당 카운터
            for page in range(1, 6):
                if query_count >= MAX_PER_QUERY:
                    break
                try:
                    q_enc = urllib.parse.quote(query)
                    search_url = (
                        "https://search.danawa.com/dsearch.php"
                        f"?query={q_enc}&originalQuery={q_enc}"
                        f"&volumeType=goods&page={page}&limit=40"
                        "&sort=saveDESC&list=list&tab=goods"
                    )
                    driver.get(search_url)
                    time.sleep(4)

                    page_results = _extract_pcodes_from_page(driver)
                    new_count = 0
                    for pcode, name in page_results:
                        if query_count >= MAX_PER_QUERY:
                            break
                        if pcode in seen_pcodes:
                            continue
                        seen_pcodes.add(pcode)
                        products.append({
                            "url": f"https://prod.danawa.com/info/?pcode={pcode}",
                            "product_name": name,
                            "search_query": query,
                            "pcode": pcode,
                        })
                        new_count += 1
                        query_count += 1

                    print(f"  페이지 {page}: +{new_count}개 (쿼리누적 {query_count}/{MAX_PER_QUERY}) → 전체 {len(products)}개")

                    if not new_count:
                        break

                except Exception as e:
                    print(f"  ⚠️ [{query} p{page}] 오류: {e}")
                    time.sleep(2)

    finally:
        try:
            driver.quit()
        except Exception:
            pass
        finally:
            del driver

    print(f"\n✅ Phase 1 완료: 총 {len(products)}개 URL 수집")
    return products[:TARGET_URL_COUNT]


# =====================================================================
# Phase 2: 경량 제품 정보 추출
# =====================================================================
def _get_fast_driver() -> uc.Chrome:
    options = uc.ChromeOptions()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1280,800")
    options.add_argument("--disable-gpu")
    options.add_argument("--blink-settings=imagesEnabled=false")  # 이미지 비활성화
    return uc.Chrome(options=options, version_main=148)


def _clean_specs(text: str) -> str:
    """스펙 텍스트 정리: 줄바꿈·슬래시 구분자 → 공백, 연속 공백 제거"""
    text = re.sub(r'[ \t]*\n[ \t]*/[ \t]*\n[ \t]*', ' / ', text)  # 값\n/\n값 → 값 / 값
    text = re.sub(r'\n+', ' ', text)                                # 나머지 줄바꿈 → 공백
    text = re.sub(r' {2,}', ' ', text)                             # 연속 공백 정리
    return text.strip()


def _extract_one(product: dict, driver: uc.Chrome) -> dict:
    """단일 제품 페이지에서 이름 + 스펙 추출 (스크롤/스크린샷 없음)"""
    try:
        driver.get(product["url"])
        time.sleep(2)

        # 제품명 (상세 페이지가 검색 페이지보다 정확)
        try:
            title = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "h3.prod_tit, .prod_tit, h2.title")
                )
            ).text.strip()
            if title and len(title) > 5:
                # "상품비교", "다나와" 등 불필요한 접미사 제거
                title = re.sub(r'\s*(상품비교|가격비교|다나와|Ai 가격비교.*)', '', title).strip()
                product["product_name"] = title
        except Exception:
            pass

        # 스펙 텍스트
        specs_text = ""
        for selector in ["prod_spec_table", "spec_list", "prod_spec_wrap"]:
            elems = driver.find_elements(By.CLASS_NAME, selector)
            if elems:
                specs_text = _clean_specs(elems[0].text)
                break

        # 카테고리 브레드크럼
        category = ""
        try:
            crumbs = driver.find_elements(
                By.CSS_SELECTOR, ".breadcrumb a, .category_depth a, .nav_path a"
            )
            category = " > ".join(e.text.strip() for e in crumbs if e.text.strip())
        except Exception:
            pass

        product["specs_text"] = specs_text[:1200]
        product["category"] = category or product.get("search_query", "")
        product["status"] = "ok"

    except Exception as e:
        product["specs_text"] = ""
        product["category"] = product.get("search_query", "")
        product["status"] = f"error: {str(e)[:100]}"

    return product


def _process_chunk(chunk: list[dict]) -> list[dict]:
    driver = _get_fast_driver()
    results = []
    try:
        for i, product in enumerate(chunk):
            results.append(_extract_one(product, driver))
            if (i + 1) % 20 == 0:
                print(f"  진행: {i+1}/{len(chunk)}")
    finally:
        try:
            driver.quit()
        except Exception:
            pass
        finally:
            del driver
    return results


def extract_all_product_info(products: list[dict]) -> list[dict]:
    print(f"\n⚡ Phase 2: {len(products)}개 제품 정보 추출 시작 (워커 {MAX_WORKERS}개)")

    chunk_size = max(1, len(products) // MAX_WORKERS)
    chunks = [products[i:i + chunk_size] for i in range(0, len(products), chunk_size)]

    all_results: list[dict] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        for chunk_result in executor.map(_process_chunk, chunks):
            all_results.extend(chunk_result)

    ok = sum(1 for r in all_results if r.get("status") == "ok")
    print(f"✅ Phase 2 완료: {ok}/{len(all_results)}개 성공")

    # ── AI 표기 필터 ─────────────────────────────────────────────────
    before = len(all_results)
    all_results = [
        p for p in all_results
        if AI_PATTERN.search(p.get("product_name", ""))
        or AI_PATTERN.search(p.get("specs_text", ""))
    ]
    print(f"  → AI 표기 필터: {before}개 → {len(all_results)}개 (제거 {before - len(all_results)}개)")

    # ── 국내 브랜드 필터 ──────────────────────────────────────────────
    before = len(all_results)
    all_results = [p for p in all_results if _is_korean_brand(p.get("product_name", ""))]
    print(f"  → 국내 브랜드 필터: {before}개 → {len(all_results)}개 (제거 {before - len(all_results)}개)")

    return all_results


# =====================================================================
# 저장 & 체크포인트
# =====================================================================
FIELDNAMES = ["domain", "product_type", "product_name", "label", "certainty", "specs_text", "url"]

# search_query → 제품 분야 변환 (AI/인공지능/스마트 접두사 제거)
_TYPE_PREFIX = re.compile(r'^(AI|인공지능|스마트\s*AI|AI기능)\s*', re.IGNORECASE)

def _product_type(search_query: str) -> str:
    return _TYPE_PREFIX.sub('', search_query).strip()


def save_csv(products: list[dict], filepath: str = OUTPUT_CSV) -> None:
    Path(filepath).parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES, extrasaction="ignore")
        writer.writeheader()
        for p in products:
            writer.writerow({
                "domain": "danawa",
                "product_type": _product_type(p.get("search_query", "")),
                "product_name": p.get("product_name", ""),
                "label": "",
                "certainty": "",
                "specs_text": p.get("specs_text", "")[:1200],
                "url": p.get("url", ""),
            })
    print(f"\n💾 저장 완료: {filepath} ({len(products)}개 레코드)")


def _save_checkpoint(phase: str, products: list[dict]) -> None:
    Path(CHECKPOINT_JSON).parent.mkdir(parents=True, exist_ok=True)
    with open(CHECKPOINT_JSON, "w", encoding="utf-8") as f:
        json.dump({"phase": phase, "products": products}, f, ensure_ascii=False, indent=2)
    print(f"  💡 체크포인트 저장 완료 (phase={phase})")


def _load_checkpoint() -> dict | None:
    if Path(CHECKPOINT_JSON).exists():
        with open(CHECKPOINT_JSON, encoding="utf-8") as f:
            return json.load(f)
    return None


# =====================================================================
# 재수집 모드: 기존 CSV URL → Phase 2만 재실행
# =====================================================================
def _reload_from_existing_csv() -> list[dict]:
    """기존 CSV에서 URL 목록 복원 (스펙 재수집용)"""
    products = []
    with open(OUTPUT_CSV, encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            products.append({
                "url": row["url"],
                "product_name": row["product_name"],
                "search_query": row["product_type"],
                "pcode": row["url"].split("pcode=")[-1],
            })
    print(f"  [재수집] 기존 CSV에서 {len(products)}개 URL 복원 완료")
    return products


# =====================================================================
# 메인
# =====================================================================
def main() -> None:
    recollect_mode = "--recollect" in sys.argv

    print("=" * 70)
    print("🏗️  AI 워싱 벤치마크 데이터셋 빌더 v2.1")
    if recollect_mode:
        print("   모드: 스펙 재수집 (기존 CSV URL 사용)")
    else:
        print(f"   수집 목표: {TARGET_URL_COUNT}개 | 쿼리당 최대: {MAX_PER_QUERY}개")
    print(f"   레이블: 수동 판별 (label 열 비워서 저장)")
    print("=" * 70)

    if recollect_mode:
        if not Path(OUTPUT_CSV).exists():
            print(f"❌ 재수집 실패: {OUTPUT_CSV} 파일이 없습니다.")
            return
        products = _reload_from_existing_csv()
        products = extract_all_product_info(products)
    else:
        cp = _load_checkpoint()
        if cp and cp.get("phase") == "extraction":
            print("⏩ 체크포인트 감지: Phase 2 (정보 추출)부터 재개")
            products = cp["products"]
            products = extract_all_product_info(products)
        else:
            # Phase 1
            products = collect_urls_from_danawa()
            _save_checkpoint("extraction", products)

            # Phase 2
            products = extract_all_product_info(products)

    # 저장
    save_csv(products)

    # 체크포인트 삭제
    if Path(CHECKPOINT_JSON).exists():
        Path(CHECKPOINT_JSON).unlink()

    print(f"\n🎉 데이터셋 구축 완료! — {len(products)}개")
    print(f"   결과 파일: {OUTPUT_CSV}")
    print(f"   → 엑셀에서 열고 label 열에 genuine / suspicious / washing 입력하세요")
    print(f"   → certainty 열에 high / medium / low 입력하세요")

    # 수집된 분야 목록 한 줄 출력 (온톨로지 추가 참고용)
    # recollect 모드: search_query가 이미 product_type 값 / 일반 모드: AI 접두사 제거 필요
    if recollect_mode:
        types = sorted({p.get("search_query", "") for p in products if p.get("search_query")})
    else:
        types = sorted({_product_type(p.get("search_query", "")) for p in products if p.get("search_query")})
    print(f"\n📋 수집 분야 ({len(types)}개): {', '.join(types)}")


if __name__ == "__main__":
    main()
