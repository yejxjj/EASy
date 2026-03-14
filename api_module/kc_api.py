import json
import os
import requests
from config import OPEN_DATA_KEY

CACHE_FILE = "kc_cache.json"
API_URL = "https://api.odcloud.kr/api/15124640/v1/uddi:9c9ef09b-339e-499f-97c3-c60ceefd9b66"

def build_cache():
    all_items = []
    page, per_page = 1, 100
    while True:
        params = {"serviceKey": OPEN_DATA_KEY, "page": page, "perPage": per_page, "returnType": "json"}
        res = requests.get(API_URL, params=params, timeout=15).json()
        if res.get("code", 0) < 0:  # 공공데이터 API는 오류시 음수 code 반환
            raise Exception(f"API 오류: {res.get('msg')}")
        items = res.get("data", [])
        if not items: break
        all_items.extend(items)
        page += 1
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=4)
    return all_items

def load_cache():
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return build_cache()

def query_kc(kc_number: str) -> dict:
# kc 인증번호 -> 무선 규격 조회
# 데이터명: 한국산업기술시험원_KC마크 인증현황 정보
# 검색형 api가 아닌 목록형 api

    items = load_cache()

    matched = next((i for i in items if i.get("인증번호", "").strip() == kc_number.strip()), None)
    if not matched:
        return {
            "status": "NOT_FOUND", 
            "has_wifi": False, 
            "wireless_spec": "확인불가"
        }
    
    spec = matched.get("규격내용","")
    return {
    #수입제조구분내용, 제조국명은 넣지 않음
        "status":       "CERTIFIED",
        "cert_id": item.get("인증정보아이디",""),
        "manufacturer": item.get("기관명", ""),
        "cert_num": item.get("인증번호",""),
        "cert_status":  item.get("인증상태내용", ""),  # 예: "적합"
        "cert_category": item.get("인증구분내용",""),
        "cert_date":    item.get("인증일자", ""),
        "initial_cert_num": item.get("최초 인증번호", ""),
        "product_name": item.get("제품명", ""),
        "product_class": item.get("법정제품분류명",""),
        "registration_date": item.get("등록일자",""),
        "specification": item.get("규격내용",""),
                
        "wireless_spec": spec,
        "has_wifi":     any(w in spec for w in ["Wi-Fi", "WiFi", "2.4G", "5G", "무선랜"]),
            }