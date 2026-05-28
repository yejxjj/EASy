"""
recollect_specs.py — 스펙이 비어있는 행만 선별 재수집

입력/출력: dataset/benchmark_dataset_last.csv (in-place 업데이트)
실행: python recollect_specs.py

- specs_text가 10자 미만인 행만 재수집
- 수집 성공 시 해당 행 specs_text 업데이트
- 기존 데이터(label, certainty 등)는 유지
"""
import csv
import re
import sys
import time
from pathlib import Path

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# =====================================================================
# 설정
# =====================================================================
INPUT_CSV  = "dataset/benchmark_dataset_last.csv"
OUTPUT_CSV = "dataset/benchmark_dataset_last.csv"   # in-place
FIELDNAMES = ["domain", "product_type", "product_name",
              "label", "certainty", "url", "specs_text"]
EMPTY_THRESHOLD = 10   # specs_text 글자 수 기준
DELAY_SEC = 2.5        # 페이지당 대기


# =====================================================================
# Selenium 드라이버
# =====================================================================
def _get_driver() -> uc.Chrome:
    options = uc.ChromeOptions()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1280,900")
    options.add_argument("--disable-gpu")
    options.add_argument("--blink-settings=imagesEnabled=false")
    options.add_argument("--lang=ko-KR")
    return uc.Chrome(options=options, version_main=148)


# =====================================================================
# 스펙 추출 (여러 셀렉터 시도 + 스크롤)
# =====================================================================
SPEC_SELECTORS = [
    ("class", "prod_spec_table"),
    ("class", "spec_list"),
    ("class", "prod_spec_wrap"),
    ("class", "specification_table"),
    ("css",   ".spec_tbl"),
    ("css",   "#productInfoSection"),
    ("css",   ".product_spec"),
    ("css",   "table.spec"),
]


def _clean_specs(text: str) -> str:
    text = re.sub(r'[ \t]*\n[ \t]*/[ \t]*\n[ \t]*', ' / ', text)
    text = re.sub(r'\n+', ' ', text)
    text = re.sub(r' {2,}', ' ', text)
    return text.strip()


def _extract_specs(driver: uc.Chrome, url: str) -> str:
    """URL에서 스펙 텍스트 추출. 실패 시 빈 문자열 반환."""
    try:
        driver.get(url)
        time.sleep(DELAY_SEC)

        # 스크롤해서 lazy-load 트리거
        driver.execute_script("window.scrollTo(0, 500)")
        time.sleep(0.5)

        for method, selector in SPEC_SELECTORS:
            try:
                if method == "class":
                    elems = driver.find_elements(By.CLASS_NAME, selector)
                else:
                    elems = driver.find_elements(By.CSS_SELECTOR, selector)
                if elems:
                    text = _clean_specs(elems[0].text)
                    if len(text) > 20:
                        return text[:1200]
            except Exception:
                continue

        # 셀렉터 모두 실패 → page_source에서 직접 파싱 시도
        source = driver.page_source
        # 다나와 스펙 테이블: <td class="col_noti"> ... </td> 패턴
        spec_blocks = re.findall(
            r'<td[^>]*class="[^"]*col_noti[^"]*"[^>]*>(.*?)</td>',
            source, re.DOTALL
        )
        if spec_blocks:
            raw = " / ".join(
                re.sub(r'<[^>]+>', '', blk).strip()
                for blk in spec_blocks if blk.strip()
            )
            cleaned = _clean_specs(raw)
            if len(cleaned) > 20:
                return cleaned[:1200]

    except Exception as e:
        print(f"    [오류] {url}: {str(e)[:80]}")

    return ""


# =====================================================================
# 메인
# =====================================================================
def main() -> None:
    print("=" * 60)
    print("[*] 빈 스펙 재수집 시작")
    print(f"   대상: {INPUT_CSV}")
    print("=" * 60)

    # 전체 행 읽기
    with open(INPUT_CSV, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    # 빈 스펙 행 인덱스 추출
    empty_indices = [
        i for i, r in enumerate(rows)
        if len(r.get("specs_text", "").strip()) < EMPTY_THRESHOLD
    ]
    print(f"  빈 스펙 행: {len(empty_indices)}개 / 전체 {len(rows)}개")

    if not empty_indices:
        print("  재수집할 행이 없습니다.")
        return

    # 분야별 현황 출력
    from collections import defaultdict
    by_type: dict = defaultdict(int)
    for i in empty_indices:
        by_type[rows[i].get("product_type", "").strip()] += 1
    for ptype, cnt in sorted(by_type.items(), key=lambda x: -x[1]):
        print(f"    {ptype}: {cnt}개")

    # 재수집 실행
    driver = _get_driver()
    success = 0
    fail = 0
    try:
        for idx, row_idx in enumerate(empty_indices):
            row = rows[row_idx]
            url = row.get("url", "").strip()
            ptype = row.get("product_type", "").strip()
            name = row.get("product_name", "")[:35]

            print(f"  [{idx+1}/{len(empty_indices)}] [{ptype}] {name}")

            if not url:
                print(f"    URL 없음, 건너뜀")
                fail += 1
                continue

            specs = _extract_specs(driver, url)
            if specs:
                rows[row_idx]["specs_text"] = specs
                success += 1
                # AI 키워드 여부 표시
                has_ai = "AI" in specs or "인공지능" in specs
                print(f"    -> {len(specs)}자 수집 {'[AI포함]' if has_ai else ''}")
            else:
                fail += 1
                print(f"    -> 수집 실패")

            # 50개마다 중간 저장
            if (idx + 1) % 50 == 0:
                _save(rows, OUTPUT_CSV)
                print(f"  [중간저장] {idx+1}개 처리 완료")

    finally:
        try:
            driver.quit()
        except Exception:
            pass

    # 최종 저장
    _save(rows, OUTPUT_CSV)

    print(f"\n[완료] 성공: {success}개 / 실패: {fail}개")
    print(f"  저장: {OUTPUT_CSV}")

    # 갱신 후 분야별 빈 스펙 현황
    remaining_empty = [
        rows[i].get("product_type", "").strip()
        for i in range(len(rows))
        if len(rows[i].get("specs_text", "").strip()) < EMPTY_THRESHOLD
    ]
    if remaining_empty:
        print(f"\n  아직 빈 스펙: {len(remaining_empty)}개")
        re_by_type: dict = defaultdict(int)
        for t in remaining_empty:
            re_by_type[t] += 1
        for ptype, cnt in sorted(re_by_type.items(), key=lambda x: -x[1]):
            print(f"    {ptype}: {cnt}개")


def _save(rows: list[dict], filepath: str) -> None:
    Path(filepath).parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    main()
