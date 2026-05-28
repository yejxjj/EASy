import pandas as pd
import time
import sys
import traceback

# 우리가 만든 파이프라인에서 실행 함수를 가져옵니다.
from pipeline_main import run_full_pipeline

def run_benchmark_automation(csv_file_path):
    print("\n" + "="*85)
    print(f"📊 [EASy] 벤치마크 데이터셋 '{csv_file_path}' 자동 검증 가동")
    print("="*85)
    
    try:
        df = pd.read_csv(csv_file_path, encoding='utf-8')
    except Exception as e:
        print(f"❌ CSV 파일을 읽는 중 오류가 발생했습니다: {e}")
        return

    # CSV 파일에 'url' 컬럼이 있는지 확인
    if 'url' not in df.columns:
        print("❌ CSV 파일에 'url' 열(Column)이 없습니다. 파일 형식을 확인해주세요.")
        return

    # 빈 줄(NaN)을 제거하고 url만 리스트로 추출
    urls = df['url'].dropna().tolist()
    total_urls = len(urls)
    
    print(f"✅ 총 {total_urls}개의 타겟 URL을 발견했습니다. 순차 분석을 시작합니다!\n")
    print("="*85)

    for i, url in enumerate(urls, 1):
        print(f"\n🚀 [전체 진행률: {i}/{total_urls}] ============================")
        print(f"👉 타겟 URL: {url}")
        
        try:
            # 🎯 메인 파이프라인 실행 
            # (결과는 자동으로 ai_washing_dataset.csv에 누적 저장됩니다)
            run_full_pipeline(url)
            
        except Exception as e:
            print(f"\n🚨 [{i}번째 상품 분석 중 치명적 에러 발생]")
            print(f"원인: {e}")
            traceback.print_exc()
            print("👉 에러를 무시하고 다음 상품으로 넘어갑니다.\n")
        
        # 🛡️ [크롤링 차단 방지] 너무 빠르게 연속 접속하면 다나와에서 IP를 차단할 수 있습니다.
        # 파이프라인이 한 번 끝날 때마다 5초간 숨을 고릅니다.
        if i < total_urls:
            print(f"⏳ 서버 부하 방지를 위해 5초 대기합니다...")
            time.sleep(5)

    print("\n" + "="*85)
    print("🎉 모든 벤치마크 URL에 대한 자동 분석이 완료되었습니다!")
    print("👉 'ai_washing_dataset.csv'를 열어 라벨링 데이터와 비교 검증을 진행해보세요.")
    print("="*85)

if __name__ == "__main__":
    TARGET_CSV = "test.csv"
    run_benchmark_automation(TARGET_CSV)