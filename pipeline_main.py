"""
pipeline_main.py — EASy 전체 통합 파이프라인
(판정 텍스트 꼬임 해결, ECS 기준 강화, 조기 종료 및 데이터셋 누적 저장 적용)
"""

import os
import sys
import shutil
import concurrent.futures
import re
import copy
import json
import pandas as pd
from sqlalchemy import create_engine, text

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from logic.crawler import get_product_data
from logic.ocr_analyzer import analyze_ai_washing
from logic.normalizer import normalize_data
from logic.llm_resolver import resolve_real_company_name, resolve_model_name
from logic.dart_scraper import check_dart_ai_washing
from logic.api import (
    verify_kipris,
    verify_koneps,
    verify_pps_mall,
    verify_nipa_solution,
    verify_kaiac,
)

import analysis_engine


# =====================================================================
# [온톨로지 패치] 회사명 일치 시 기본 인프라 조건 통과
# =====================================================================
original_scope = analysis_engine.OntologyAnalysisEngine._scope_compatible


def patched_scope(self, req_scope, ev_scope):
    rs, es = str(req_scope or "").strip().lower(), str(ev_scope or "").strip().lower()
    if rs == "company_or_product" and es in {"company", "product", "model", "company_or_product"}:
        return True
    return original_scope(self, req_scope, ev_scope)


analysis_engine.OntologyAnalysisEngine._scope_compatible = patched_scope

original_weak = analysis_engine.OntologyAnalysisEngine._match_requirement_weak


def patched_weak(self, component_name, ev, ev_text):
    if component_name in ["기본 하드웨어 인프라", "기본 기술 인프라"]:
        if ev.matched_company:
            return True
    return original_weak(self, component_name, ev, ev_text)


analysis_engine.OntologyAnalysisEngine._match_requirement_weak = patched_weak

original_strong = analysis_engine.OntologyAnalysisEngine._match_requirement_strong


def patched_strong(self, component_name, ev, ev_text):
    if component_name in ["기본 하드웨어 인프라", "기본 기술 인프라"]:
        if ev.matched_company:
            return True
    return original_strong(self, component_name, ev, ev_text)


analysis_engine.OntologyAnalysisEngine._match_requirement_strong = patched_strong


# =====================================================================
# DB 연결 및 로컬 검색 엔진
# =====================================================================
DB_URL = 'mysql+pymysql://admin:fidescapstone@fides-db.cdgw08ugc1uu.ap-northeast-2.rds.amazonaws.com:3306/CapstonDesign'
engine = create_engine(DB_URL, pool_pre_ping=True)


def search_kc_db_local(company_aliases, model_name):
    base_model = model_name[:5] if len(model_name) >= 5 else model_name
    clean_aliases = list(set([re.sub(r'\(주\)|주식회사|\s', '', a) for a in company_aliases if a]))

    if not clean_aliases:
        return {'detail': '검색어 없음', 'records': []}

    comp_cond = " OR ".join([
        f"REPLACE(REPLACE(company_name, '(주)', ''), ' ', '') LIKE :c{i}"
        for i in range(len(clean_aliases))
    ])
    params = {f"c{i}": f"%{c}%" for i, c in enumerate(clean_aliases)}

    try:
        with engine.connect() as conn:
            query = f"""
                SELECT * FROM kc_ai_products
                WHERE ({comp_cond})
                  AND (
                    equip_name REGEXP '무선|통신|센서|비전|스마트|IoT|블루투스|Wi-Fi|제어|AI|인공지능'
                    OR model_name LIKE :model
                  )
                LIMIT 50
            """
            params['model'] = f"%{base_model}%"
            df = pd.read_sql(text(query), conn, params=params)
            records = df.to_dict(orient="records") if not df.empty else []

            if records:
                return {'detail': f"✅ 로컬 DB에서 RRA 인증 {len(records)}건 확인", 'records': records}
            return {'detail': "❌ DB 매칭 없음 (AI/통신 하드웨어 내역 없음)", 'records': []}

    except Exception as e:
        return {'error': f"DB 오류: {str(e)}", 'records': []}


def search_cert_db_local(company_aliases):
    clean_aliases = list(set([re.sub(r'\(주\)|주식회사|\s', '', a) for a in company_aliases if a]))

    if not clean_aliases:
        return {'detail': '검색어 없음', 'records': []}

    comp_cond = " OR ".join([
        f"REPLACE(REPLACE(company_name, '(주)', ''), ' ', '') LIKE :c{i}"
        for i in range(len(clean_aliases))
    ])
    params = {f"c{i}": f"%{c}%" for i, c in enumerate(clean_aliases)}

    try:
        with engine.connect() as conn:
            query = f"""
                SELECT * FROM cert_products
                WHERE ({comp_cond})
                  AND product_name REGEXP 'AI|인공지능|딥러닝|머신러닝|소프트웨어|플랫폼|알고리즘|제어|스마트홈|인식|비전|음성'
                LIMIT 50
            """
            df = pd.read_sql(text(query), conn, params=params)
            records = df.to_dict(orient="records") if not df.empty else []

            if records:
                return {'detail': f"✅ 로컬 DB에서 인증 {len(records)}건 확인", 'records': records}
            return {'detail': "❌ DB 매칭 없음", 'records': []}

    except Exception as e:
        return {'error': f"DB 오류: {str(e)}", 'records': []}


# =====================================================================
# 데이터셋 자동 누적 저장 로직 (Dataset Accumulator)
# =====================================================================
def save_to_dataset(product_info, scores, final_score, is_ai_product, verdict, risk_level):
    csv_filename = "ai_washing_dataset.csv"
    model_name = product_info.get("model", "미확인")
    file_exists = os.path.isfile(csv_filename)

    if file_exists:
        try:
            existing_df = pd.read_csv(csv_filename, encoding='utf-8-sig')
            if model_name in existing_df['모델명'].values:
                print(f"\n⚠️ [DataSave] '{model_name}' 모델은 이미 dataset에 존재하여 누적 저장을 스킵합니다.")
                return
        except Exception as e:
            print(f"CSV 중복 검사 오류 (무시하고 진행): {e}")

    if not is_ai_product:
        label = "일반 상품 (Non-AI)"
    elif final_score >= 85:
        label = "매우 신뢰 (Normal)"
    elif final_score >= 70:
        label = "신뢰 (Normal)"
    elif final_score >= 60:
        label = "워싱 의심 (Suspected)"
    else:
        label = "AI 워싱 상품 (Washing)"

    data = {
        "상품카테고리": product_info.get("category", "기타"),
        "법인명(브랜드)": product_info.get("company", "미확인"),
        "모델명": model_name,
        "광고내_AI키워드": "O" if is_ai_product else "X",
        "HW실체성(HES)": scores.get("hes", 0),
        "기술근거성(TES)": scores.get("tes", 0),
        "인증신뢰성(CES)": scores.get("ces", 0),
        "다양성(ECS)": scores.get("ecs", 0),
        "DART_상태": "O" if scores.get("has_dart") else "X",
        "총_신뢰도점수": final_score,
        "최종판정_라벨": label,
        "상세판정": verdict,
        "위험도": risk_level,
        "검증일시": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"),
    }

    df = pd.DataFrame([data])
    df.to_csv(csv_filename, mode='a', index=False, header=not file_exists, encoding='utf-8-sig')
    print(f"\n [DataSave] 분석 결과가 '{csv_filename}'에 누적 저장되었습니다!")


def save_dynamic_weight_log(product_info, analysis_result, url=""):
    """
    analysis_engine.py에서 생성한 동적 가중치 로그를 JSONL로 누적 저장한다.

    - B 방식 적용:
      analysis_engine.py는 dynamic_weight_log를 생성하여 details에 포함한다.
      pipeline_main.py는 해당 로그를 꺼내 파일로 저장한다.
    - 기존 CSV 저장 로직과 분리하여, 분석 결과 요약 CSV에는 영향을 주지 않는다.
    """
    log_filename = "analysis_logs.jsonl"

    details = getattr(analysis_result, "details", {}) or {}
    dynamic_weight_log = details.get("dynamic_weight_log")

    if not dynamic_weight_log:
        print("\n [DynamicWeightLog] 저장할 동적 가중치 로그가 없습니다.")
        return

    log_data = {
        "url": url,
        "category": product_info.get("category", "기타"),
        "company": product_info.get("company", "미확인"),
        "model": product_info.get("model", "미확인"),
        "hes": getattr(analysis_result, "hes", 0),
        "tes": getattr(analysis_result, "tes", 0),
        "ces": getattr(analysis_result, "ces", 0),
        "ecs": getattr(analysis_result, "ecs", 0),
        "conf": getattr(analysis_result, "conf", 0),
        "final_accs": getattr(analysis_result, "accs", 0),
        "verdict": getattr(analysis_result, "verdict", ""),
        "risk_level": getattr(analysis_result, "risk_level", ""),
        "dynamic_weight_log": dynamic_weight_log,
        "created_at": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"),
    }

    try:
        with open(log_filename, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_data, ensure_ascii=False) + "\n")
        print(f"\n [DynamicWeightLog] 동적 가중치 로그가 '{log_filename}'에 저장되었습니다!")
    except Exception as e:
        print(f"\n [DynamicWeightLog] 로그 저장 중 오류 발생: {e}")


# =====================================================================
# 파이프라인 코어 로직
# =====================================================================
def generate_tailored_search_payload(raw_llm_name, scraping_aliases=None):
    base_list = [n.strip() for n in raw_llm_name.split(',')] if ',' in raw_llm_name else [raw_llm_name]

    if scraping_aliases:
        base_list.extend(scraping_aliases)

    base_list = list(set([n for n in base_list if n]))
    payload = {"pps_mall": [], "local_db": [], "kipris": [], "dart": [], "nipa": []}
    expanded_names = []

    for name in base_list:
        clean_name = re.sub(r'\(주\)|주식회사|\(유\)|㈜', '', name).strip()
        if not clean_name:
            continue

        # 1. 원본 추가 (예: Lg전자)
        expanded_names.append(clean_name)
        # 2. 전체 대문자 추가 (예: LG전자)
        expanded_names.append(clean_name.upper())
        # 3. 전체 소문자 추가 (예: lg전자)
        expanded_names.append(clean_name.lower())

    # 확장된 검색어 리스트에서 중복 제거
    expanded_names = list(set(expanded_names))

    for clean_name in expanded_names:
        payload["kipris"].append(clean_name)
        payload["local_db"].append(clean_name)
        payload["nipa"].append(clean_name)

        if re.search(r'[가-힣]', clean_name):
            payload["dart"].append(clean_name)

        pps_clean = re.sub(r'^주\s*|\s*주$', '', clean_name)
        pps_clean = re.sub(r'[^\w\s가-힣0-9a-zA-Z]', '', pps_clean).strip()

        # 조달청은 순수 한글 검색만 허용하는 로직 유지
        if re.search(r'[a-zA-Z]', pps_clean):
            continue
        if re.search(r'[가-힣]', pps_clean) and len(pps_clean) > 1:
            payload["pps_mall"].append(pps_clean)

    for key in payload:
        payload[key] = list(set(payload[key]))

    return payload


def _get_valid_api_result(res_dict):
    if not res_dict:
        return None

    if isinstance(res_dict, dict):
        if res_dict.get('error') or (res_dict.get('score', 0) == 0 and res_dict.get('total_score', 0) == 0):
            return None
        return copy.deepcopy(res_dict)

    return res_dict


def secure_analyze_bundle(**kwargs):
    records = analysis_engine.bundle_to_evidence_records(
        product_json=kwargs.get('product_json'),
        db_results=kwargs.get('db_results'),
        jodale_result=kwargs.get('jodale_result'),
        tipa_result=kwargs.get('tipa_result'),
        patent_items_df=kwargs.get('patent_items_df'),
        cert_results=kwargs.get('cert_results'),
        dart_result=kwargs.get('dart_result'),
        target_company_name=kwargs.get('target_company_name', ""),
        model_param=kwargs.get('model_param', ""),
    )

    for rec in records:
        rec.matched_company = True

    sys_hw_trigger = "sys_hw_baseline"
    sys_tech_trigger = "sys_tech_baseline"
    base_desc = str(kwargs.get('product_json', {}).get("description", ""))
    ocr_text = str(kwargs.get('product_json', {}).get("ocr_text", ""))
    ad_text = f"{sys_hw_trigger} {sys_tech_trigger} {base_desc} {ocr_text}"

    o_engine = analysis_engine.OntologyAnalysisEngine(ontology_dir=kwargs.get('ontology_dir'))
    repo = o_engine.repo

    if 'CAP_BASE_HW' not in repo.capability_map:
        repo.capability_map['CAP_BASE_HW'] = {
            "capability_id": "CAP_BASE_HW",
            "capability_name_ko": "기업 하드웨어 제조 인프라",
        }

    repo.requirements_by_cap['CAP_BASE_HW'] = [
        {"component_name_ko": "기본 하드웨어 인프라", "required_level": "required"}
    ]
    repo.patterns_by_cap['CAP_BASE_HW'] = [
        {"pattern_text_ko": sys_hw_trigger, "evidence_strength": "strong"}
    ]
    repo.req_map_by_cap['CAP_BASE_HW'] = [
        {
            "component_name_ko": "기본 하드웨어 인프라",
            "acceptable_evidence_source": "kc",
            "required_level": "required",
            "minimum_strength": "weak",
            "match_scope": "any",
        },
        {
            "component_name_ko": "기본 하드웨어 인프라",
            "acceptable_evidence_source": "rra",
            "required_level": "required",
            "minimum_strength": "weak",
            "match_scope": "any",
        },
    ]
    repo.scoring_rule_map['CAP_BASE_HW'] = {
        "capability_id": "CAP_BASE_HW",
        "required_fulfillment_weight": 1.2,
        "optional_fulfillment_weight": 0.0,
        "strong_pattern_weight": 0.0,
        "weak_pattern_weight": 0.0,
        "source_quality_weight": 0.0,
        "required_threshold_for_positive": 0.1,
        "confusion_penalty": 0,
        "company_only_penalty": 20,
        "model_level_bonus": 20,
        "product_level_bonus": 10,
    }

    if 'CAP_BASE_TECH' not in repo.capability_map:
        repo.capability_map['CAP_BASE_TECH'] = {
            "capability_id": "CAP_BASE_TECH",
            "capability_name_ko": "기업 기술 R&D 인프라",
        }

    repo.requirements_by_cap['CAP_BASE_TECH'] = [
        {"component_name_ko": "기본 기술 인프라", "required_level": "required"}
    ]
    repo.patterns_by_cap['CAP_BASE_TECH'] = [
        {"pattern_text_ko": sys_tech_trigger, "evidence_strength": "strong"}
    ]
    repo.req_map_by_cap['CAP_BASE_TECH'] = [
        {
            "component_name_ko": "기본 기술 인프라",
            "acceptable_evidence_source": "kipris",
            "required_level": "required",
            "minimum_strength": "weak",
            "match_scope": "any",
        },
        {
            "component_name_ko": "기본 기술 인프라",
            "acceptable_evidence_source": "tta",
            "required_level": "required",
            "minimum_strength": "weak",
            "match_scope": "any",
        },
        {
            "component_name_ko": "기본 기술 인프라",
            "acceptable_evidence_source": "dart",
            "required_level": "required",
            "minimum_strength": "weak",
            "match_scope": "any",
        },
        {
            "component_name_ko": "기본 기술 인프라",
            "acceptable_evidence_source": "nipa",
            "required_level": "required",
            "minimum_strength": "weak",
            "match_scope": "any",
        },
    ]
    repo.scoring_rule_map['CAP_BASE_TECH'] = {
        "capability_id": "CAP_BASE_TECH",
        "required_fulfillment_weight": 1.2,
        "optional_fulfillment_weight": 0.0,
        "strong_pattern_weight": 0.0,
        "weak_pattern_weight": 0.0,
        "source_quality_weight": 0.1,
        "required_threshold_for_positive": 0.1,
        "confusion_penalty": 0,
        "company_only_penalty": 20,
        "model_level_bonus": 15,
        "product_level_bonus": 10,
    }

    return o_engine.analyze(records, ad_text=ad_text, ocr_text=ocr_text)


def run_full_pipeline(url: str):
    if not url:
        print("❌ 실행할 URL이 없습니다.")
        return

    print("\n" + "=" * 85)
    print(" [EASy] 실시간 AI 워싱 검증 파이프라인 가동")
    print("=" * 85)

    scraped_item = get_product_data(url)
    if not scraped_item:
        return

    img_path = scraped_item.get("screenshot_path", "")
    ocr_result = {}
    ocr_text = ""
    is_ai_product = True

    if img_path:
        ocr_result = analyze_ai_washing(img_path)
        ocr_text = ocr_result.get("extracted_text", "")
        is_ai_product = ocr_result.get("is_ai_product", True)

        save_dir = os.path.dirname(img_path) if os.path.dirname(img_path) else "product_images"
        os.makedirs(save_dir, exist_ok=True)
        json_path = os.path.join(save_dir, "ocr_result.json")

        try:
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(ocr_result, f, ensure_ascii=False, indent=4)
        except Exception as e:
            pass

    # [Early Exit] 비(非) AI 상품 즉시 판정 및 통신 스킵
    if not is_ai_product:
        print("\n [조기 종료] 광고 이미지 내 AI/인공지능 키워드가 발견되지 않았습니다.")
        print(" AI 홍보를 하지 않는 일반 상품으로 분류하여 무거운 공공데이터 통신을 스킵합니다.")

        norm_result = normalize_data(scraped_item)
        fast_company = norm_result.get("norm_company", "미확인")
        fast_model = norm_result.get("final_norm_model", "미확인")

        save_to_dataset(
            product_info={
                "category": scraped_item.get("category", ""),
                "company": fast_company,
                "model": fast_model,
            },
            scores={"hes": 0, "tes": 0, "ces": 0, "ecs": 0, "has_dart": False},
            final_score=0,
            is_ai_product=False,
            verdict="분석 스킵 (비 AI 상품)",
            risk_level="없음(일반상품)",
        )
        return

    norm_result = normalize_data(scraped_item)
    official_company = resolve_real_company_name(norm_result.get("raw_company", ""), scraped_item.get("model_name", ""))
    official_model = resolve_model_name(scraped_item.get("model_name", ""), ocr_text) or norm_result.get("final_norm_model", "미확인")
    product_category = scraped_item.get("category", "") if isinstance(scraped_item.get("category"), str) else ""
    llm_aliases = scraped_item.get("aliases", [])
    search_payload = generate_tailored_search_payload(official_company, llm_aliases)

    print(f"\n 분석 대상: {official_company} / {official_model}")
    print("⏳ 로컬 DB 및 다중 API 통신을 병렬로 진행합니다...\n")

    final_results = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        dart_target_list = search_payload["dart"] if search_payload["dart"] else [official_company]
        futures = {
            executor.submit(check_dart_ai_washing, dart_target_list, scraped_item.get("model_name")): 'DART',
            executor.submit(verify_kipris, search_payload["kipris"], product_category): 'KIPRIS',
            executor.submit(search_kc_db_local, search_payload["local_db"], official_model): 'RRA',
            executor.submit(search_cert_db_local, search_payload["local_db"]): 'TTA',
            executor.submit(verify_nipa_solution, search_payload["nipa"]): 'AI공급',
            executor.submit(verify_pps_mall, search_payload["pps_mall"]): '조달몰',
            executor.submit(verify_koneps, search_payload["pps_mall"]): '나라장터',
            executor.submit(verify_kaiac, search_payload["local_db"]): 'KAIAC',
        }

        for future in concurrent.futures.as_completed(futures):
            final_results[futures[future]] = future.result()

    print("\n 온톨로지 기반 AI Claim Credibility Score(ACCS) 산출 중...")

    ontology_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ontology")
    rra_records = copy.deepcopy(
        final_results.get('RRA', {}).get('records', []) if isinstance(final_results.get('RRA'), dict) else []
    )
    tta_records = copy.deepcopy(
        final_results.get('TTA', {}).get('records', []) if isinstance(final_results.get('TTA'), dict) else []
    )
    kipris_res = final_results.get('KIPRIS', {})

    if isinstance(kipris_res, dict) and (kipris_res.get('detail') or kipris_res.get('evidence')):
        kip_text = f"{kipris_res.get('detail', '')} {kipris_res.get('evidence', '')}"
        patent_items_df = pd.DataFrame([{"title": kip_text}])
    else:
        patent_items_df = None

    analysis_result = secure_analyze_bundle(
        ontology_dir=ontology_path,
        product_json={
            "name": official_model,
            "description": str(scraped_item.get("description", "")),
            "ocr_text": ocr_text,
            "specs": scraped_item.get("specs", {}),
        },
        db_results=rra_records,
        jodale_result=_get_valid_api_result(final_results.get('조달몰')) or _get_valid_api_result(final_results.get('나라장터')),
        tipa_result=_get_valid_api_result(final_results.get('AI공급')),
        patent_items_df=patent_items_df,
        cert_results=tta_records,
        dart_result=_get_valid_api_result(final_results.get('DART')),
        target_company_name=official_company,
        model_param=official_model,
    )

    h_found = 1 if analysis_result.hes > 0 else 0
    t_found = 1 if analysis_result.tes > 0 else 0
    c_found = 1 if analysis_result.ces > 0 else 0
    has_dart = 1 if _get_valid_api_result(final_results.get('DART')) else 0
    active_channels = h_found + t_found + c_found + (1 if has_dart and t_found else 0)

    if active_channels == 0:
        analysis_result.tes = analysis_result.hes = analysis_result.ces = analysis_result.ecs = analysis_result.accs = 0.0
        analysis_result.verdict = "증거 전무 (워싱 고위험)"
        analysis_result.reasons = ["모든 공공/인증 DB에서 일치하는 기업 및 제품 내역이 단 하나도 발견되지 않았습니다."]

    elif h_found > 0 and t_found > 0:
        wh, wt = 0.45, 0.55
        new_raw_accs = (wh * analysis_result.hes) + (wt * analysis_result.tes)
        channel_bonus = active_channels * 4.0
        new_raw_accs += channel_bonus

        if c_found:
            new_raw_accs = new_raw_accs + (analysis_result.ces * 0.15)

        new_raw_accs = min(100.0, new_raw_accs)
        ecs_ratio = active_channels / 4.0
        new_ecs = round(min(1.0, ecs_ratio) * 100.0, 2)
        alpha = 0.85
        new_accs = round((alpha * new_raw_accs) + ((1 - alpha) * new_ecs), 2)

        if not c_found:
            new_accs = min(new_accs, 84.99)

        analysis_result.ecs = new_ecs
        analysis_result.accs = new_accs

        if new_accs >= 85:
            analysis_result.verdict = "매우 신뢰 (제3자 공인 완료)"
            analysis_result.risk_level = "매우 낮음"
        elif new_accs >= 70:
            analysis_result.verdict = "신뢰 (자체 기술력 입증)"
            analysis_result.risk_level = "낮음"
        elif new_accs >= 60:
            analysis_result.verdict = "검토 필요 (일부 증거 확인)"
            analysis_result.risk_level = "보통"
        else:
            analysis_result.verdict = "근거 부족 (워싱 의심)"
            analysis_result.risk_level = "높음"

    else:
        new_accs = min(analysis_result.accs, 59.99)
        analysis_result.accs = new_accs
        analysis_result.verdict = "교차 검증 실패 (단일 증거 의존)"
        analysis_result.risk_level = "높음"
        analysis_result.reasons.append(
            " 하드웨어 실체성과 기술적 근거성이 상호 교차 검증되지 않아 신뢰도가 대폭 삭감되었습니다."
        )

    clean_reasons = []
    for r in analysis_result.reasons:
        if any(keyword in r for keyword in ["최종 판정은", "위험도는", "온톨로지 기반", "계산되었습니다"]):
            continue
        clean_reasons.append(r)
    analysis_result.reasons = clean_reasons

    print("\n" + "=" * 85)
    print(" [1] AI 워싱 검증 상세 근거 (Evidence Detail)")
    print("=" * 85)

    print(f"\n [제품 상세페이지 OCR 분석]")
    if ocr_text:
        print(f"└ ✅ 제품 이미지에서 텍스트 추출 완료 (총 {len(ocr_text)}자)")
        snippet = ocr_text.replace('\n', ' ')[:80]
        print(f" 추출 텍스트 요약: {snippet}...")
        if isinstance(ocr_result, dict) and "analysis" in ocr_result:
            claims = ocr_result["analysis"].get("core_claims", [])
            print(f" 식별된 AI 주장(Claims): {', '.join(claims) if claims else '없음'}")
    else:
        print(f"└ ❌ 추출된 OCR 텍스트 없음 (이미지 누락 또는 분석 실패)")

    sources = [
        ('DART 공시 실적', 'DART'),
        ('KIPRIS 특허 실적', 'KIPRIS'),
        ('RRA 전파인증 (로컬DB)', 'RRA'),
        ('TTA/GS 인증 (로컬DB)', 'TTA'),
        ('AI솔루션 공급기업', 'AI공급'),
        ('조달/나라장터', '조달몰'),
        ('한국인공지능인증센터', 'KAIAC'),
    ]

    for title, key in sources:
        res = final_results.get(key, {})
        print(f"\n [{title} 분석]")
        if isinstance(res, dict):
            if res.get('error'):
                print(f"└ ❌ 에러: {res['error']}")
            else:
                print(f"└ {res.get('detail', '내역 없음')}")

                records = res.get('records', [])
                if records:
                    print(f" 주요 검색 결과:")
                    for i, rec in enumerate(records[:3], 1):
                        print(f" {i}. {rec.get('equip_name') or rec.get('product_name') or rec.get('model_name')}")

                evidence = res.get('evidence', [])
                if evidence:
                    print(f" 주요 실적 내역:")
                    if isinstance(evidence, str):
                        print(f" - {evidence}")
                    elif isinstance(evidence, list):
                        for i, ev in enumerate(evidence[:3], 1):
                            print(f" {i}. {ev}")

    print("\n" + "=" * 85)
    print(" [2] 온톨로지 기반 AI 신뢰도 종합 보고서")
    print("=" * 85)
    print(f" 타겟 법인: {official_company} | 제품/모델: {official_model}")
    print("-" * 85)
    print("\n[지표별 점수 (100점 만점 기준)]")
    print(f"▶ HES (하드웨어 실체성): {analysis_result.hes:05.2f}점")
    print(f"▶ TES (기술적 근거성) : {analysis_result.tes:05.2f}점")
    print(f"▶ CES (인증/공공 신뢰성): {analysis_result.ces:05.2f}점")
    print(f"▶ ECS (근거 채널 다양성): {analysis_result.ecs:05.2f}점")
    print(f"▶ CONF (분석 신뢰도) : {analysis_result.conf:05.2f}점")
    print("-" * 85)
    print(f"⭐ 최종 AI 주장 신뢰도 (ACCS) : {analysis_result.accs:05.2f} / 100 점")

    verdict_icon = "" if "신뢰" in analysis_result.verdict else "" if "검토" in analysis_result.verdict else ""
    print(f"{verdict_icon} 최종 판정 : {analysis_result.verdict} (위험도: {analysis_result.risk_level})")

    for reason in analysis_result.reasons:
        print(f" - {reason}")

    print("=" * 85 + "\n")

    product_info_for_save = {
        "category": product_category,
        "company": official_company,
        "model": official_model,
    }

    save_dynamic_weight_log(
        product_info=product_info_for_save,
        analysis_result=analysis_result,
        url=url,
    )

    save_to_dataset(
        product_info=product_info_for_save,
        scores={
            "hes": analysis_result.hes,
            "tes": analysis_result.tes,
            "ces": analysis_result.ces,
            "ecs": analysis_result.ecs,
            "has_dart": bool(has_dart),
        },
        final_score=analysis_result.accs,
        is_ai_product=is_ai_product,
        verdict=analysis_result.verdict,
        risk_level=analysis_result.risk_level,
    )


if __name__ == "__main__":
    target_url = "https://prod.danawa.com/info/?pcode=82630370&keyword=lg+ai&cate=10239280"
    run_full_pipeline(target_url)
