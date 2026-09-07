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

import hashlib
import json
import os
import sys
import time
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


def _log(message: str) -> None:
    """진행 로그를 출력하되, 출력 실패가 수집을 중단시키지 않게 한다.

    기본 Windows 콘솔(cp949)에서는 이모지를 인코딩하지 못해 print가
    UnicodeEncodeError를 던진다. 이 예외가 아래 except 절에 잡히면 그 안의
    print가 다시 같은 예외를 내고, 결국 특허 수집 함수 전체가 실패한다.
    로그 한 줄 때문에 근거 수집이 통째로 사라지지 않도록 한다.
    """
    try:
        print(message)
    except UnicodeEncodeError:
        encoding = getattr(sys.stdout, "encoding", None) or "ascii"
        print(message.encode(encoding, errors="replace").decode(encoding, errors="replace"))
    except Exception:
        pass


def _first_xml_text(node, *tags, default=""):
    """Return the first non-empty text among possible KIPRIS tag aliases."""
    for tag in tags:
        value = node.findtext(tag)
        if value is not None and str(value).strip():
            return str(value).strip()
    return default


# 조회 자체가 실패했을 때 쓰는 search_type 접두사. 호출자는 이 값으로
# "특허 없음"과 "확인 불가"를 구분한다.
SEARCH_TYPE_UNAVAILABLE = "조회불가"


class KiprisApiError(RuntimeError):
    """KIPRIS가 오류 응답을 돌려줬을 때 발생한다.

    이 예외가 필요한 이유: KIPRIS는 한도 초과/키 오류에도 HTTP 200을 주고
    본문 헤더에만 successYN=N 을 실어 보낸다. totalCount 태그가 없으므로
    예전 코드는 이를 "특허 0건"으로 읽었다. 그 결과 '조회 실패'와
    '실제로 특허가 없음'이 구분되지 않아, LG전자처럼 특허 1,335건을 가진
    회사가 화면에 "특허 0건"으로 표시되고 TES 점수까지 부당하게 깎였다.
    """

    def __init__(self, message, result_code=""):
        super().__init__(message)
        self.result_code = str(result_code or "")

    @property
    def quota_exceeded(self):
        # resultCode 22 = LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR
        return self.result_code == "22"


def _request_search(params, timeout=10):
    """Execute one KIPRIS request and return (root, total_count)."""
    query_string = "&".join(
        f"{key}={urllib.parse.quote(str(value))}" if key != "ServiceKey" else f"{key}={value}"
        for key, value in params.items()
    )
    response = requests.get(f"{BASE_URL}?{query_string}", timeout=timeout)
    response.raise_for_status()
    root = ET.fromstring(response.text)

    # 오류 응답을 0건으로 오해하지 않도록 헤더를 먼저 확인한다.
    success = (root.findtext(".//successYN") or "").strip().upper()
    result_code = (root.findtext(".//resultCode") or "").strip()
    if success == "N" or (result_code and result_code not in ("00", "0")):
        result_msg = (root.findtext(".//resultMsg") or "알 수 없는 오류").strip()
        raise KiprisApiError(f"{result_msg} (resultCode={result_code})", result_code)

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



# ---------------------------------------------------------------------------
# 회사 단위 특허 캐시
# ---------------------------------------------------------------------------
# KIPRIS 검색은 회사(출원인) + 제품 카테고리로만 이뤄진다. 모델명이 들어가지
# 않으므로 같은 회사의 제품 20개를 분석하면 완전히 동일한 검색을 20번 한다.
# 실제로 벤치마크를 돌리다 일일 호출 한도를 소진했고, 그 동안 모든 제품이
# "특허 0건"으로 기록됐다. 결과를 회사 단위로 저장해 반복 호출을 없앤다.
#
# 특허 데이터는 하루 사이에 의미 있게 변하지 않으므로 기본 보존 기간을 7일로
# 둔다. 그보다 오래되면 다시 조회한다.
PATENT_CACHE_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dataset", "patent_cache"
)
PATENT_CACHE_MAX_AGE_DAYS = 7


def _patent_cache_key(aliases, product_keyword):
    """별칭 순서가 달라도 같은 검색이면 같은 키가 되게 한다."""
    normalized = "|".join(sorted({str(a).strip().upper() for a in aliases if str(a).strip()}))
    raw = f"{normalized}::{str(product_keyword or '').strip().upper()}"
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:24]


def _read_patent_cache(key):
    path = os.path.join(PATENT_CACHE_DIR, f"{key}.json")
    if not os.path.exists(path):
        return None
    age_days = (time.time() - os.path.getmtime(path)) / 86400.0
    if age_days > PATENT_CACHE_MAX_AGE_DAYS:
        return None
    try:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, ValueError):
        return None
    return int(data.get("count", 0)), data.get("items") or [], str(data.get("search_type", ""))


def _write_patent_cache(key, count, items, search_type, aliases, product_keyword):
    # 조회 실패는 저장하지 않는다. 저장하면 한도 초과 상태가 캐시에 굳어
    # 한도가 풀린 뒤에도 계속 "특허 없음"으로 나온다.
    if str(search_type or "").startswith(SEARCH_TYPE_UNAVAILABLE):
        return
    try:
        os.makedirs(PATENT_CACHE_DIR, exist_ok=True)
        payload = {
            "aliases": list(aliases),
            "product_keyword": product_keyword,
            "count": int(count),
            "search_type": search_type,
            "items": items,
        }
        with open(os.path.join(PATENT_CACHE_DIR, f"{key}.json"), "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False)
    except (OSError, TypeError, ValueError) as exc:
        _log(f"⚠️ 특허 캐시 저장 실패(무시하고 진행): {exc}")


def get_company_patent_data(
    company_aliases, product_keyword="", service_key=KIPRIS_SERVICE_KEY, use_cache=True
):
    """KIPRIS API로 기업의 AI 관련 특허를 검색합니다.

    같은 회사·카테고리 조합은 결과를 재사용한다(`use_cache`). 검색어에 모델명이
    들어가지 않으므로 같은 회사의 제품을 여러 개 분석해도 결과가 동일하다.
    """
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

    cache_key = _patent_cache_key(deduped_aliases, product_keyword)
    if use_cache:
        cached = _read_patent_cache(cache_key)
        if cached is not None:
            count, items, search_type = cached
            _log(f"💾 특허 캐시 사용: {deduped_aliases[0]} -> {count}건 (API 호출 없음)")
            frame = pd.DataFrame(items)
            return (count, frame, search_type)

    max_count = 0
    best_items = []
    best_search_type = "일반 AI"
    api_error = None  # 조회 실패 사유. 남아 있으면 결과 0건은 "없음"이 아니라 "확인 불가"다.

    for alias in deduped_aliases:
        if product_keyword:
            precise_query = (
                f"AP=[{alias}]*(TI=[{AI_QUERY}]+AB=[{AI_QUERY}])*TI=[{product_keyword}]"
            )
        else:
            precise_query = f"AP=[{alias}]*(TI=[{AI_QUERY}]+AB=[{AI_QUERY}])"

        params = {
            "word": precise_query,
            "patent": "true",
            "numOfRows": "50",
            "ServiceKey": service_key,
        }

        try:
            # Important: one network request per query. The old code made the same
            # request twice before fallback, doubling API usage for no benefit.
            root, count = _request_search(params)
            current_search_type = f"'{product_keyword}' 연관 AI" if product_keyword else "일반 AI"
            current_query = precise_query
            _log(f"📡 KIPRIS 검색: 쿼리 '{current_query}' -> {count}건 발견")

            if count == 0 and product_keyword:
                _log(
                    f"⚠️ '{alias}'의 '{product_keyword}' 연관 특허 0건. "
                    "일반 AI 특허로 재검색합니다."
                )
                fallback_query = f"AP=[{alias}]*(TI=[{AI_QUERY}]+AB=[{AI_QUERY}])"
                params["word"] = fallback_query
                root, count = _request_search(params)
                current_search_type = "일반 AI"
                current_query = fallback_query
                _log(f"📡 KIPRIS 재검색: 쿼리 '{current_query}' -> {count}건 발견")

            if count > 0 and count >= max_count:
                max_count = count
                best_search_type = current_search_type
                best_items = _parse_items(root, alias, current_search_type, current_query)

        except KiprisApiError as exc:
            api_error = str(exc)
            _log(f"❌ KIPRIS 조회 실패 ({alias}): {exc}")
            if exc.quota_exceeded:
                # 한도가 끝났으면 남은 별칭도 전부 실패한다. 계속 돌면
                # 별칭 수만큼(LG전자는 15개) 헛되이 호출만 늘어난다.
                _log("⛔ KIPRIS 일일 호출 한도 초과 - 남은 별칭 검색을 중단합니다.")
                break
            continue

        except Exception as exc:
            api_error = str(exc)
            _log(f"❌ KIPRIS 통신 오류 ({alias}): {exc}")
            continue

    df_items = pd.DataFrame(best_items)
    if not df_items.empty and "출원일자" in df_items.columns:
        df_items["출원일자"] = df_items["출원일자"].apply(_format_application_date)

    if max_count == 0 and api_error:
        # 한 건도 못 찾았는데 오류가 있었다면 "특허 없음"이라고 단정할 수 없다.
        return (0, df_items, f"{SEARCH_TYPE_UNAVAILABLE}: {api_error}")

    if use_cache:
        _write_patent_cache(
            cache_key,
            max_count,
            df_items.to_dict(orient="records") if not df_items.empty else [],
            best_search_type,
            deduped_aliases,
            product_keyword,
        )

    return (max_count, df_items, best_search_type)
