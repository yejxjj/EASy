import sys
import os
import json

# 1. 모듈 경로 설정 (logic 폴더의 파일들을 불러오기 위함)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'logic')))

# 2. 각 모듈의 함수들을 import
try:
    from logic.crawler import get_product_data       # 크롤러
    from logic.normalizer import normalize_data   # 정규화
    from logic.llm_resolver import resolve_real_company_name  # 법인 추론
    from logic.dart_scraper import check_dart_ai_washing      # DART 분석
except ImportError as e:
    print(f"❌ 모듈 로드 에러: {e}")
    sys.exit(1)

def run_full_pipeline(test_url):
    print(f"🚀 [전체 파이프라인 테스트 시작] 타겟 URL: {test_url}\n")

    # STEP 1: 크롤링 (Crawler)
    print("Step 1. 크롤링 중...")
    scraped_data = get_product_data(test_url)
    if not scraped_data:
        print("❌ 크롤링 실패")
        return
    print(f"✅ 완료: 상품명 - {scraped_data.get('model_name')}\n")

    # STEP 2: 데이터 정규화 (Normalizer)
    print("Step 2. 데이터 정규화 및 회사명 추출 중...")
    norm_res = normalize_data(scraped_data)
    brand_name = norm_res.get("norm_company", "미확인")
    print(f"✅ 완료: 추출된 브랜드 - {brand_name}\n")

    # STEP 3: 법인명 추론 (LLM Resolver)
    print(f"Step 3. '{brand_name}'의 실제 법인명 추론 중 (DB 캐시 및 제미나이 활용)...")
    resolved_company_raw = resolve_real_company_name(brand_name, scraped_data.get('model_name', ""))
    # 쉼표로 구분된 결과 중 첫 번째 법인명 선택
    final_company = resolved_company_raw.split(',')[0].strip()
    print(f"✅ 완료: 최종 법인명 - {final_company}\n")

    # STEP 4: DART 공시 분석 (DART Scraper)
    print(f"Step 4. '{final_company}' DART 공시 분석 및 AI 검증 중...")
    dart_result = check_dart_ai_washing(final_company)
    print(f"✅ 완료: 검증 상태 - {dart_result.get('status')}\n")

    # 최종 결과 출력
    print("="*60)
    print("📊 [최종 통합 분석 리포트]")
    print(f" - 상품명: {scraped_data.get('model_name')}")
    print(f" - 법인명: {final_company}")
    print(f" - DART 상태: {dart_result.get('status')}")
    print(f" - 기술 등급: {dart_result.get('level')}")
    print(f" - 상세 내역: {dart_result.get('detail')}")
    print("="*60)

if __name__ == "__main__":
    # 테스트하고 싶은 다나와 URL을 여기에 넣으세요.
    sample_url = "https://prod.danawa.com/info/?pcode=106702589&keyword=%EA%B0%A4%EB%9F%AD%EC%8B%9C+ai+%EB%B2%84%EC%A6%88&cate=12237349" # 삼성전자 예시
    run_full_pipeline(sample_url)