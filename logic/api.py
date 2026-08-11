"""
integrated_api.py — 기관 통합 검증 모듈

External API functions return not only a summary/score but, where available,
the underlying records.  The rule engine performs the final relevance and
credibility judgment; collection functions must not discard evidence text.
"""

import os
import re
import sys
import urllib.parse
from datetime import datetime, timedelta

import pandas as pd
import requests
from sqlalchemy import create_engine

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    import config

    COMMON_DATAGO_KEY = getattr(config, "DATAGO_API_KEY", "")
    KIPRIS_KEY = getattr(config, "KIPRIS_KEY", "")
    NIPA_KEY = getattr(config, "DATAGO_API_KEY", "")
except ImportError:
    print("❌ 에러: config.py 파일을 찾을 수 없습니다.")
    COMMON_DATAGO_KEY = KIPRIS_KEY = NIPA_KEY = ""

DB_URL = "mysql+pymysql://root:1234@localhost:3306/CapstonDesign"
try:
    engine = create_engine(DB_URL)
except Exception:
    engine = None

try:
    from logic.patent_scraper import get_company_patent_data
except ImportError:
    get_company_patent_data = None


def clean_name(name):
    """(주), 주식회사, (유) 등을 제거하고 대문자로 통일."""
    if not name:
        return ""
    name = re.sub(r"\(주\)|주식회사|\(유\)|주\s|", "", str(name))
    return name.strip().upper()


def _record_text(row):
    if not isinstance(row, dict):
        return str(row or "")
    return " ".join(str(v) for v in row.values() if v not in (None, ""))


# =====================================================================
# Local DB: RRA, TTA
# =====================================================================

def verify_rra(company_aliases: list, model: str) -> dict:
    if not engine:
        return {"score": 0, "error": "DB 연결 실패"}
    search_model = model.split()[0] if model else ""

    for alias in company_aliases:
        name = clean_name(alias)
        try:
            query = (
                "SELECT cert_no FROM rra "
                f"WHERE company_name LIKE '%%{name}%%' "
                f"AND model_name LIKE '%%{search_model}%%' LIMIT 1"
            )
            df = pd.read_sql(query, engine)
            if not df.empty:
                record = df.iloc[0].to_dict()
                return {
                    "score": 20,
                    "records": [record],
                    "evidence": f"인증번호: {record.get('cert_no', '')}",
                    "detail": f"RRA 인증 DB에 [{alias}] 명의 실체가 등록되어 있습니다.",
                }
        except Exception:
            continue
    return {"score": 0, "detail": "RRA 전파인증 DB 내역 없음", "evidence": None, "records": []}


def verify_tta(company_aliases: list) -> dict:
    if not engine:
        return {"score": 0, "error": "DB 연결 실패"}
    for alias in company_aliases:
        name = clean_name(alias)
        try:
            query = f"SELECT * FROM tta_cert_list WHERE company_name LIKE '%%{name}%%' LIMIT 10"
            df = pd.read_sql(query, engine)
            if not df.empty:
                return {
                    "score": 20,
                    "records": df.to_dict(orient="records"),
                    "evidence": "TTA GS인증 보유",
                    "detail": f"TTA 소프트웨어 품질 인증 명단({alias}) 확인되었습니다.",
                }
        except Exception:
            continue
    return {"score": 0, "detail": "TTA/GS 인증 내역 없음", "evidence": None, "records": []}


# =====================================================================
# KIPRIS
# =====================================================================

def verify_kipris(company_aliases: list, product_keyword: str = "") -> dict:
    if not KIPRIS_KEY:
        return {"score": 0, "error": "KIPRIS 키 미설정", "records": []}
    if not get_company_patent_data:
        return {"score": 0, "error": "patent_scraper 모듈 없음", "records": []}

    # Deduplicate aliases without changing the visible company text stored in rows.
    deduped = []
    seen = set()
    for alias in company_aliases or []:
        if not alias:
            continue
        key = str(alias).strip().upper()
        if key and key not in seen:
            seen.add(key)
            deduped.append(str(alias).strip())

    try:
        count, df, search_type = get_company_patent_data(
            company_aliases=deduped,
            product_keyword=product_keyword,
            service_key=KIPRIS_KEY,
        )
        records = df.to_dict(orient="records") if isinstance(df, pd.DataFrame) and not df.empty else []

        if count > 0:
            titles = [
                str(row.get("발명의명칭(한글)") or row.get("title") or "").strip()
                for row in records
            ]
            titles = [title for title in titles if title]
            evidence = titles[:10]
            first_title = titles[0] if titles else "특허 내역"
            return {
                "status": "verified",
                "score": 30,
                "count": int(count),
                "returned_count": len(records),
                "search_type": search_type,
                "records": records,
                "evidence": evidence or [f"특허 확인: {first_title}"],
                "detail": (
                    f"KIPRIS 조회 결과 {search_type} 특허 {count}건이 확인되었고, "
                    f"그중 {len(records)}건의 세부 레코드를 분석 엔진으로 전달합니다."
                ),
            }
    except Exception as exc:
        print(f"[KIPRIS 에러] {exc}")
        return {"score": 0, "error": f"KIPRIS 통신 실패: {exc}", "records": []}

    return {
        "score": 0,
        "detail": "AI 특허 내역 없음",
        "evidence": None,
        "records": [],
        "search_type": "none",
    }


# =====================================================================
# 나라장터 / 조달몰
# =====================================================================

def verify_koneps(company_aliases: list) -> dict:
    """나라장터 낙찰정보 - 최근 1년을 1개월 단위로 역순 검색."""
    if not COMMON_DATAGO_KEY:
        return {"score": 0, "error": "API 키 미설정"}

    url = "http://apis.data.go.kr/1230000/ScsbidInfoService/getScsbidListSttusServc01"
    today = datetime.today()
    search_names = list(
        set(clean_name(name) for name in company_aliases if len(clean_name(name)) > 1)
    )

    for name in search_names:
        for month_offset in range(12):
            end_dt = today - timedelta(days=30 * month_offset)
            start_dt = end_dt - timedelta(days=30)
            try:
                params = {
                    "serviceKey": urllib.parse.unquote(COMMON_DATAGO_KEY),
                    "numOfRows": "100",
                    "inqryBgnDt": start_dt.strftime("%Y%m%d%H%M"),
                    "inqryEndDt": end_dt.strftime("%Y%m%d%H%M"),
                    "type": "json",
                }
                response = requests.get(url, params=params, timeout=10)
                if response.status_code != 200:
                    continue
                items = response.json().get("response", {}).get("body", {}).get("items", [])
                if isinstance(items, dict):
                    items = items.get("item", [])
                for item in items or []:
                    entrps_nm = item.get("scsbidEntrpsNm", "")
                    if name not in entrps_nm:
                        continue
                    title = item.get("bidNtceNm", "")
                    if any(
                        kw in title.upper()
                        for kw in ["AI", "인공지능", "빅데이터", "소프트웨어", "시스템", "구축", "유지보수", "개발"]
                    ):
                        return {
                            "score": 15,
                            "records": [item],
                            "evidence": f"낙찰: {title}",
                            "detail": f"나라장터 조회 결과, [{name}] 명의의 공공 사업 실적(최근 1년 내)이 확인되었습니다.",
                        }
            except Exception as exc:
                print(f"[나라장터 에러] {name} {month_offset}개월 전 조회 중 예외 발생: {exc}")
                continue

    return {"score": 0, "detail": "최근 1년간 나라장터 낙찰 실적 없음", "evidence": None, "records": []}


def verify_pps_mall(company_aliases: list) -> dict:
    if not COMMON_DATAGO_KEY:
        return {"score": 0, "error": "API 키 미설정"}

    url = "http://apis.data.go.kr/1230000/ShoppingMallPrdctInfoService/getShoppingMallPrdctInfoList"
    search_names = []
    for raw_name in company_aliases:
        split_names = raw_name.split(",") if "," in raw_name else [raw_name]
        for s_name in split_names:
            clean = re.sub(r"\(주\)|주식회사|\(유\)|㈜|^주\s*|\s*주$", "", s_name)
            clean = re.sub(r"[^\w\s가-힣0-9a-zA-Z]", "", clean).strip()
            if re.search(r"[가-힣]", clean) and len(clean) > 1:
                search_names.append(clean)
    search_names = list(set(search_names))
    safe_key = urllib.parse.unquote(COMMON_DATAGO_KEY)

    for name in search_names:
        try:
            params = {
                "serviceKey": safe_key,
                "pageNo": "1",
                "numOfRows": "10",
                "type": "json",
                "entrpsNm": name,
            }
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 500:
                print(f"⚠️ [조달몰] '{name}' 검색 불가 (조달청 서버 500 에러)")
                continue
            if response.status_code == 200:
                print(f"✅ [조달몰] '{name}' 서버 통신 성공 (데이터 분석 중...)")
                res_json = response.json()
                items = res_json.get("response", {}).get("body", {}).get("items", [])
                if isinstance(items, dict):
                    items = items.get("item", [])
                if items:
                    records = items if isinstance(items, list) else [items]
                    target = records[0]
                    return {
                        "score": 5,
                        "records": records[:10],
                        "evidence": f"몰 등록: {name}",
                        "detail": f"조달청 디지털서비스몰 상품({target.get('prdctNm', '등록 상품')} 등) 등록 확인.",
                    }
        except Exception:
            continue

    return {"score": 0, "detail": "조달청 디지털서비스몰 등록 내역 없음", "evidence": None, "records": []}


# =====================================================================
# NIPA / KAIAC
# =====================================================================

def verify_nipa_solution(company_aliases: list) -> dict:
    # Existing project key retained for compatibility. Move secrets to config/env
    # separately; this patch focuses on preserving evidence records.
    key = "QnGWF0isjBPG/EXxLVhwkts/GtuhtD3cAEf3bEzXPvt73kfBsPflla8lVoK8VtBQLaTw1rhvMpiMHjIFoX6Pew=="
    url = "https://api.odcloud.kr/api/15089204/v1/uddi:4d85feed-91b3-4774-bb76-ce7fd277c990"
    headers = {"Authorization": f"Infuser {key}"}

    try:
        params = {"page": 1, "perPage": 2000, "returnType": "JSON"}
        res = requests.get(url, headers=headers, params=params, timeout=15, verify=False)
        if res.status_code == 200:
            items = res.json().get("data", [])
            for alias in company_aliases:
                clean_target = clean_name(alias).replace(" ", "")
                if not clean_target:
                    continue
                matched_rows = [
                    row
                    for row in items
                    if clean_target in _record_text(row).replace(" ", "").upper()
                ]
                if matched_rows:
                    return {
                        "score": 20,
                        "records": matched_rows[:20],
                        "evidence": f"NIPA 등록 확인: {alias}",
                        "detail": (
                            f"NIPA 제조AI 공급기업 명단에서 [{alias}] 관련 레코드 "
                            f"{len(matched_rows)}건이 확인되었습니다."
                        ),
                    }
        else:
            print(f"[NIPA 에러] 응답코드: {res.status_code}")
    except Exception as exc:
        print(f"[NIPA 예외 발생] {exc}")
        return {"score": 0, "error": f"NIPA 통신 실패: {exc}", "records": []}

    return {"score": 0, "detail": "NIPA 공급기업 명단 내역 없음", "evidence": None, "records": []}


def verify_kaiac(company: str) -> dict:
    return {"score": 0, "detail": "KAIAC 품질 인증 내역 미확인", "evidence": None, "records": []}
