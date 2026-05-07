"""
llm_resolver.py — Gemini 기반 동적 엔티티 리졸루션

브랜드명/상품명으로 실제 한국 법인명을 Gemini 2.5 Flash + Google Search grounding으로 역추적합니다.
DB 캐시는 현재 비활성화 상태 — 매 요청마다 Gemini API를 직접 호출합니다.
"""

import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from google import genai
from google.genai import types

try:
    import config
    _api_key = config.GEMINI_API_KEY
except ImportError:
    _api_key = os.environ.get("GEMINI_API_KEY", "")

client = genai.Client(api_key=_api_key)


def _extract_text_from_response(response, fallback=""):
    """Gemini 응답에서 텍스트를 안전하게 추출합니다."""
    try:
        if response.text:
            return response.text
    except Exception:
        pass
    try:
        for candidate in (response.candidates or []):
            content = candidate.content
            if not content:
                continue
            for part in (content.parts or []):
                t = getattr(part, 'text', None)
                if t:
                    return t
    except Exception:
        pass
    return fallback


def _ask_gemini(prompt):
    """서버 과부하(503) 발생 시 잠시 대기 후 최대 3번까지 재시도합니다."""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[types.Tool(google_search=types.GoogleSearch())]
                )
            )
            return _extract_text_from_response(response, fallback="").strip().replace(".", "").replace("\n", "").replace("**", "").strip()

        except Exception as e:
            if "503" in str(e) or "UNAVAILABLE" in str(e):
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 2
                    print(f"⚠️ 서버 부하 감지(503). {wait_time}초 후 다시 시도합니다... ({attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                    continue

            print(f"⚠️ 제미나이 API 호출 최종 실패: {e}")
            return ""


def resolve_real_company_name(brand_name, product_name=""):
    """쇼핑몰 브랜드명으로 실제 한국 법인명을 역추적합니다."""
    if not brand_name or brand_name in ["미확인", "없음", ""]:
        return brand_name

    print(f"🧠 [동적 엔티티 탐색] '{brand_name}'의 법인명 구글링 중...")

    try:
        # 1단계: 브랜드 소유·특허 출원 법인명 검색
        result1 = _ask_gemini(f"""
            한국 전파인증(KC) DB와 특허청(KIPRIS)에서 '{brand_name}' 브랜드 제품 '{product_name}'을 찾으려 해.
            이 브랜드와 관련된 한국 법인명(수입사, 제조사, 특허출원인 등)을 모두 찾아줘.
            [출력규칙] 핵심 법인명만 쉼표로 구분해서 나열. 주식회사/(주) 제외. 설명 금지. 못찾으면 '{brand_name}'만 출력.
        """)
        candidates = [c.strip() for c in result1.split(',') if c.strip()]

        # 2단계: 후보가 없으면 KC 수입사 기준으로 재질문
        if not candidates:
            result2 = _ask_gemini(f"""
                '{product_name}' 제품의 한국 KC 전파인증 수입사 또는 책임자 법인명을 찾아줘.
                [출력규칙] 핵심 법인명만 쉼표로 구분. 주식회사/(주) 제외. 설명 금지.
            """)
            extra = [c.strip() for c in result2.split(',') if c.strip()]
            candidates = list(set(extra))

        final = ','.join(candidates) if candidates else brand_name
        print(f"   👉 최종 법인명: [{final}]")
        return final

    except Exception as e:
        print(f"⚠️ 제미나이 API 검색 실패: {e}")
        return brand_name


def resolve_model_name(product_title, specs_text=""):
    """Gemini를 이용해 공식 모델번호를 찾습니다."""
    if not product_title:
        return ""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"""
            너는 전파인증(RRA) DB 검색 전문가야.
            상품명 '{product_title}'의 공식 기술 모델명만 출력해.
            """,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())]
            )
        )
        model_name = _extract_text_from_response(response, fallback="")
        return model_name.strip()
    except Exception:
        return ""
