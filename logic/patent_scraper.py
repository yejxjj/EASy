"""
patent_scraper.py — KIPRIS 특허 검색
"""

import os
import sys
import urllib.parse
import xml.etree.ElementTree as ET
import pandas as pd
import requests
import re

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import config
    KIPRIS_SERVICE_KEY = config.KIPRIS_KEY
except ImportError:
    KIPRIS_SERVICE_KEY = os.environ.get("KIPRIS_KEY", "")

BASE_URL = "https://plus.kipris.or.kr/kipo-api/kipi/patUtiModInfoSearchSevice/getAdvancedSearch"

AI_PATENT_KEYWORDS = [
    "인공지능", "AI", "딥러닝", "머신러닝", "기계학습", "신경망", "뉴럴네트워크",
    "음성인식", "자연어처리", "자연어", "언어모델", "생성형", "LLM",
    "컴퓨터비전", "영상인식", "이미지인식", "객체인식", "패턴인식",
    "추천", "추론", "학습모델", "학습 장치", "NPU"
]

def _is_ai_related_patent(title: str, abstract: str) -> bool:
    text = f"{str(title)} {str(abstract)}".upper()
    return any(keyword.upper() in text for keyword in AI_PATENT_KEYWORDS)

def _is_product_related(title: str, abstract: str, product_keyword: str) -> bool:
    if not product_keyword or product_keyword == "기타":
        return False
    tokens = [t.strip() for t in re.split(r"[\s,/]+", product_keyword) if len(t.strip()) > 1]
    text = f"{str(title)} {str(abstract)}".upper()
    return any(token.upper() in text for token in tokens)

def _first_xml_text(node, *tags, default=""):
    for tag in tags:
        value = node.findtext(tag)
        if value is not None and str(value).strip():
            return str(value).strip()
    return default

def _request_search(params, timeout=15):
    query_string = "&".join(
        f"{key}={urllib.parse.quote(str(value), safe='*[]')}"
        if key != "ServiceKey"
        else f"{key}={value}"
        for key, value in params.items()
    )

    url = f"{BASE_URL}?{query_string}"
    response = requests.get(url, timeout=timeout)
    response.raise_for_status()

    root = ET.fromstring(response.text)
    success_yn = root.findtext(".//successYN", default="Y")
    
    if success_yn != "Y":
        return root, 0

    count_text = root.findtext(".//count/totalCount", default="0") or "0"
    try:
        count = int(count_text)
    except ValueError:
        count = 0

    return root, count

def _parse_items(root, alias, search_query, product_keyword=""):
    rows = []
    for item in root.findall(".//items/item"):
        index_no = _first_xml_text(item, "indexNo", default="-")
        application_no = _first_xml_text(item, "applicationNumber", "applicationNo", "applNo", default="")
        title = _first_xml_text(item, "inventionTitle", default="제목없음")
        application_date = _first_xml_text(item, "applicationDate", default="-")
        applicant = _first_xml_text(item, "applicantName", default=alias)
        register_status = _first_xml_text(item, "registerStatus", default="-")
        abstract = _first_xml_text(item, "astrtCont", "abstract", "abstractText", default="")
        ipc = _first_xml_text(item, "ipcNumber", "ipc", default="")
        cpc = _first_xml_text(item, "cpcNumber", "cpc", default="")

        if not _is_ai_related_patent(title, abstract):
            continue

        is_product_match = _is_product_related(title, abstract, product_keyword)
        relevance_type = "product_ai" if is_product_match else "general_ai"
        match_confidence = 0.90 if is_product_match else 0.45

        source_record_id = application_no or index_no
        rows.append({
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
            "relevance_type": relevance_type,
            "match_confidence": match_confidence,
            "search_alias": alias,
            "search_type": "AI 특허 [제품연관]" if is_product_match else "AI 특허 [일반]",
            "search_query": search_query,
            "status": "verified",
        })
    return rows

def _format_application_date(value):
    value = str(value or "")
    if len(value) == 8 and value.isdigit():
        return f"{value[:4]}-{value[4:6]}-{value[6:]}"
    return value

def _clean_applicant_name(name):
    if not name:
        return ""
    return re.sub(r"\(주\)|주식회사|\(유\)|㈜|유한회사|합자회사|합명회사|co\.,?\s*ltd\.?|inc\.?|corp\.?", "", str(name), flags=re.IGNORECASE).strip()

def get_company_patent_data(company_aliases, product_keyword="", service_key=KIPRIS_SERVICE_KEY):
    if not service_key:
        return (0, pd.DataFrame(), "키 없음")

    if isinstance(company_aliases, str):
        company_aliases = [company_aliases]

    raw_aliases = [str(alias).strip() for alias in (company_aliases or []) if str(alias).strip() and str(alias).strip() != "미확인"]
    if not raw_aliases:
        return (0, pd.DataFrame(), "미확인")

    expanded_aliases = []
    for alias in raw_aliases:
        expanded_aliases.append(alias)
        cleaned = _clean_applicant_name(alias)
        if cleaned and cleaned != alias:
            expanded_aliases.append(cleaned)
        expanded_aliases.append(f"{alias}*")
        if cleaned:
            expanded_aliases.append(f"{cleaned}*")

    deduped_aliases = []
    seen = set()
    for alias in sorted(list(set(expanded_aliases)), key=lambda x: (not any('가' <= c <= '힣' for c in x), len(x))):
        key = alias.upper()
        if key not in seen:
            seen.add(key)
            deduped_aliases.append(alias)

    target_aliases = deduped_aliases[:3]
    max_count = 0
    best_items = []
    best_search_type = "일반 AI"

    for alias in target_aliases:
        if len(alias.replace("*", "")) < 2:
            continue

        ai_core = "인공지능+AI+딥러닝+머신러닝+신경망+자연어"
        search_word = f"AP=[{alias}]*AD=[20210101~20261231]*(TI=[{ai_core}]+AB=[{ai_core}])"
        
        params = {
            "word": search_word, 
            "patent": "true", 
            "numOfRows": "200", 
            "ServiceKey": service_key
        }
        
        try:
            root, count = _request_search(params)
            if count > 0:
                items = _parse_items(root, alias, search_word, product_keyword)
                if items:
                    best_items.extend(items)
                    break
        except Exception as e:
            print(f"[KIPRIS API 에러] {alias} 검색 실패: {e}")
            continue

    df_items = pd.DataFrame(best_items)
    if not df_items.empty and "출원일자" in df_items.columns:
        df_items["출원일자_sort"] = df_items["출원일자"].apply(lambda x: str(x).replace("-", "").replace(".", ""))
        
        if "match_confidence" in df_items.columns:
            df_items = df_items.sort_values(by=["match_confidence", "출원일자_sort"], ascending=[False, False])
        else:
            df_items = df_items.sort_values(by="출원일자_sort", ascending=False)
            
        df_items = df_items.drop(columns=["출원일자_sort"])
        df_items["출원일자"] = df_items["출원일자"].apply(_format_application_date)
        
        max_count = len(df_items)
        best_search_type = df_items.iloc[0].get("search_type", "AI 특허")

    return (max_count, df_items, best_search_type)