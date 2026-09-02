"""
patent_scraper.py — KIPRIS 특허 검색

특허청 KIPRIS Plus API를 호출하여 기업의 AI 관련 특허 건수와 실제 검색 레코드를 조회합니다.
검색 결과는 analysis_engine에서 capability별 기술근거(TES)로 재판정합니다.

검색 전략 (Fallback):
    1차: 출원인 + AI 키워드 + 제품 카테고리 정밀 검색
    2차: 1차 결과가 0건이면 출원인 + AI 키워드 일반 검색
    회사명 동의어 각각에 대해 검색 후 최대 건수 결과를 채택

반환값:
    (patent_count, df_items, search_type)
"""

import os
import sys
import urllib.parse
import xml.etree.ElementTree as ET

import pandas as pd
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import config
    KIPRIS_SERVICE_KEY = config.KIPRIS_KEY
except ImportError:
    KIPRIS_SERVICE_KEY = os.environ.get("KIPRIS_KEY", "")


BASE_URL = "http://plus.kipris.or.kr/kipo-api/kipi/patUtiModInfoSearchSevice/getAdvancedSearch"
AI_QUERY = "인공지능+AI+딥러닝+머신러닝+신경망+LLM+생성형AI+자연어"


def _first_xml_text(node, *tags, default=""):
    """Return the first non-empty text among possible KIPRIS tag aliases."""
    for tag in tags:
        value = node.findtext(tag)
        if value is not None and str(value).strip():
            return str(value).strip()
    return default


def _request_search(params, timeout=10):
    """Execute one KIPRIS request and return (root, total_count)."""
    query_string = "&".join(
        f"{key}={urllib.parse.quote(str(value))}" if key != "ServiceKey" else f"{key}={value}"
        for key, value in params.items()
    )
    response = requests.get(f"{BASE_URL}?{query_string}", timeout=timeout)
    response.raise_for_status()
    root = ET.fromstring(response.text)
    count = int(root.findtext(".//count/totalCount", default="0") or 0)
    return root, count


def _parse_items(root, alias, search_type, search_query):
    """Preserve the actual KIPRIS rows instead of reducing them to one summary."""
    rows = []
    for item in root.findall(".//items/item"):
        index_no = _first_xml_text(item, "indexNo", default="-")
        application_no = _first_xml_text(
            item, "applicationNumber", "applicationNo", "applNo", default=""
        )
        title = _first_xml_text(item, "inventionTitle", default="제목없음")
        application_date = _first_xml_text(item, "applicationDate", default="-")
        applicant = _first_xml_text(item, "applicantName", default=alias)
        register_status = _first_xml_text(item, "registerStatus", default="-")
        abstract = _first_xml_text(
            item,
            "astrtCont",       # KIPRIS Plus abstract field used by some endpoints
            "abstract",
            "abstractText",
            default="",
        )
        ipc = _first_xml_text(item, "ipcNumber", "ipc", default="")
        cpc = _first_xml_text(item, "cpcNumber", "cpc", default="")

        source_record_id = application_no or index_no
        rows.append(
            {
                "source_record_id": source_record_id,
                "일련번호": index_no,
                "출원번호": application_no,
                "발명의명칭(한글)": title,
                "출원일자": application_date,
                "출원인": applicant,
                "등록상태": register_status,
                "초록": abstract,
                "IPC": ipc,
                "CPC": cpc,
                "search_alias": alias,
                "search_type": search_type,
                "search_query": search_query,
                "status": "verified",
            }
        )
    return rows


def _format_application_date(value):
    value = str(value or "")
    if len(value) == 8 and value.isdigit():
        return f"{value[:4]}-{value[4:6]}-{value[6:]}"
    return value


def get_company_patent_data(company_aliases, product_keyword="", service_key=KIPRIS_SERVICE_KEY):
    """KIPRIS API로 기업의 AI 관련 특허를 검색합니다."""
    if not service_key:
        return (0, pd.DataFrame(), "키 없음")

    if isinstance(company_aliases, str):
        company_aliases = [company_aliases]

    company_aliases = [str(alias).strip() for alias in (company_aliases or []) if str(alias).strip()]
    if not company_aliases or company_aliases == ["미확인"]:
        return (0, pd.DataFrame(), "미확인")

    # Preserve order while removing duplicates; repeated upper/lower aliases waste API quota.
    deduped_aliases = []
    seen = set()
    for alias in company_aliases:
        key = alias.upper()
        if key not in seen:
            seen.add(key)
            deduped_aliases.append(alias)

    max_count = 0
    best_items = []
    best_search_type = "일반 AI"

    for alias in company_aliases:
        ai_query = "인공지능+AI+딥러닝+머신러닝+신경망+LLM"
        if product_keyword:
            search_word = f"AP=[{alias}]*(TI=[{ai_query}]+AB=[{ai_query}])*TI=[{product_keyword}]"
        else:
            search_word = f"AP=[{alias}]*(TI=[{ai_query}]+AB=[{ai_query}])"

        params = {
            "word": precise_query,
            "patent": "true",
            "numOfRows": "50",
            "ServiceKey": service_key,
        }

        try:
            current_search_type = "일반 AI"
            query_string = "&".join([f"{k}={urllib.parse.quote(str(v))}" if k != "ServiceKey" else f"{k}={v}" for k, v in params.items()])
            resp = requests.get(f"{base_url}?{query_string}", timeout=10)

            resp.raise_for_status()

            root = ET.fromstring(resp.text)
            count = int(root.findtext(".//count/totalCount", default="0"))
            
            print(f"📡 KIPRIS 검색: 쿼리 '{search_word}' -> {count}건 발견")

            query_string = "&".join([f"{k}={urllib.parse.quote(str(v))}" if k != "ServiceKey" else f"{k}={v}" for k, v in params.items()])
            resp = requests.get(f"{base_url}?{query_string}", timeout=10)
            resp.raise_for_status()

            root = ET.fromstring(resp.text)
            count = int(root.findtext(".//count/totalCount", default="0"))
            
            print(f"📡 KIPRIS 검색: 쿼리 '{search_word}' -> {count}건 발견")

            if count == 0 and product_keyword:
                print(
                    f"⚠️ '{alias}'의 '{product_keyword}' 연관 특허 0건. "
                    "일반 AI 특허로 재검색합니다."
                )
                fallback_query = f"AP=[{alias}]*(TI=[{AI_QUERY}]+AB=[{AI_QUERY}])"
                params["word"] = fallback_query
                root, count = _request_search(params)
                current_search_type = "일반 AI"
                current_query = fallback_query
                print(f"📡 KIPRIS 재검색: 쿼리 '{current_query}' -> {count}건 발견")

            if count > 0 and count >= max_count:
                max_count = count
                best_search_type = current_search_type
                best_items = _parse_items(root, alias, current_search_type, current_query)

        except Exception as exc:
            print(f"❌ KIPRIS 통신 오류 ({alias}): {exc}")
            continue

    df_items = pd.DataFrame(best_items)
    if not df_items.empty and "출원일자" in df_items.columns:
        df_items["출원일자"] = df_items["출원일자"].apply(_format_application_date)

    return (max_count, df_items, best_search_type)
