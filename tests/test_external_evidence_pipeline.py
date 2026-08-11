from __future__ import annotations

import ast
import copy
import importlib
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch

import pandas as pd

from analysis_engine import OntologyAnalysisEngine, _record_from_mapping, bundle_to_evidence_records
from fides_integration import secure_analyze_bundle

ROOT = Path(__file__).resolve().parents[1]


def load_pipeline_helpers():
    """Load only pure helper functions from pipeline_main.py without importing Selenium/DB code."""
    source = (ROOT / "pipeline_main.py").read_text(encoding="utf-8")
    tree = ast.parse(source)
    wanted = {"_get_valid_api_result", "_build_patent_items_df"}
    nodes = [node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name in wanted]
    module = ast.Module(body=nodes, type_ignores=[])
    namespace = {"copy": copy, "pd": pd}
    exec(compile(module, str(ROOT / "pipeline_main.py"), "exec"), namespace)
    return namespace


class ExternalEvidencePipelineTests(unittest.TestCase):
    def test_pipeline_keeps_record_result_even_when_numeric_score_is_zero(self):
        helpers = load_pipeline_helpers()
        result = {
            "score": 0,
            "records": [{"title": "실제 외부 근거", "company_name": "LG전자"}],
            "detail": "세부 레코드 존재",
        }
        kept = helpers["_get_valid_api_result"](result)
        self.assertIsNotNone(kept)
        self.assertEqual(len(kept["records"]), 1)

    def test_pipeline_discards_true_empty_result(self):
        helpers = load_pipeline_helpers()
        result = {"score": 0, "total_score": 0, "records": [], "evidence": None}
        self.assertIsNone(helpers["_get_valid_api_result"](result))

    def test_pipeline_builds_dataframe_from_actual_kipris_records(self):
        helpers = load_pipeline_helpers()
        payload = {
            "score": 30,
            "records": [
                {"source_record_id": "P1", "발명의명칭(한글)": "생성형 AI 질의응답 방법"},
                {"source_record_id": "P2", "발명의명칭(한글)": "LLM 기반 문서 요약 방법"},
            ],
        }
        df = helpers["_build_patent_items_df"](payload)
        self.assertEqual(len(df), 2)
        self.assertEqual(df.iloc[0]["source_record_id"], "P1")

    def test_korean_kipris_fields_are_normalized(self):
        record = _record_from_mapping(
            {
                "일련번호": "17",
                "출원번호": "10-2025-0001234",
                "발명의명칭(한글)": "생성형 AI 기반 질의응답 시스템",
                "출원일자": "2025-04-20",
                "출원인": "LG전자",
                "초록": "대규모 언어 모델을 이용하여 문서를 요약하고 사용자 질의에 응답한다.",
            },
            "kipris",
            "LG전자",
            "16Z90TS-GU7WK",
            "KIPRIS 특허",
            assume_company_filtered=True,
        )
        self.assertEqual(record.title, "생성형 AI 기반 질의응답 시스템")
        self.assertEqual(record.source_record_id, "10-2025-0001234")
        self.assertEqual(record.published_at, "2025-04-20")
        self.assertTrue(record.matched_company)
        self.assertEqual(record.relation_type, "company_general")

    def test_bundle_preserves_each_patent_as_separate_record(self):
        df = pd.DataFrame([
            {"source_record_id": "P1", "발명의명칭(한글)": "생성형 AI 질의응답", "출원인": "LG전자"},
            {"source_record_id": "P2", "발명의명칭(한글)": "LLM 문서 요약", "출원인": "LG전자"},
        ])
        records = bundle_to_evidence_records(
            patent_items_df=df,
            target_company_name="LG전자",
            model_param="16Z90TS-GU7WK",
        )
        patents = [r for r in records if r.source_type == "kipris"]
        self.assertEqual(len(patents), 2)
        self.assertEqual({r.source_record_id for r in patents}, {"P1", "P2"})

    def test_relevant_company_patent_raises_tes(self):
        common = dict(
            product_json={
                "title": "LG전자 그램 프로 16Z90TS-GU7WK Copilot+ PC",
                "specs": {"AI": "Copilot+ PC", "NPU": "47 TOPS"},
                "raw_specs": "AI노트북 온디바이스 AI NPU 47 TOPS Gram Chat",
                "manufacturer": "LG전자",
                "model_name": "16Z90TS-GU7WK",
                "url": "test://gram",
            },
            norm_info={"company_name": "LG전자", "model_name": "16Z90TS-GU7WK"},
            target_company_name="LG전자",
            model_param="16Z90TS-GU7WK",
            ontology_dir=str(ROOT / "ontology"),
        )
        no_patent = secure_analyze_bundle(**common)
        patent_df = pd.DataFrame([
            {
                "source_record_id": "P-LLM-1",
                "발명의명칭(한글)": "생성형 AI 기반 사용자 질의응답 및 문서 요약 방법",
                "출원인": "LG전자",
                "출원일자": "2025-04-20",
                "초록": "대규모 언어 모델 LLM을 이용해 문서를 요약하고 사용자 질의에 응답하는 생성형 AI 기술",
                "status": "verified",
            }
        ])
        with_patent = secure_analyze_bundle(patent_items_df=patent_df, **common)
        self.assertEqual(no_patent.tes, 0.0)
        self.assertGreater(with_patent.tes, 0.0)
        self.assertGreater(with_patent.accs, no_patent.accs)

    def test_unrelated_company_patent_does_not_raise_tes(self):
        result = secure_analyze_bundle(
            product_json={
                "title": "LG전자 그램 프로 16Z90TS-GU7WK Copilot+ PC",
                "raw_specs": "AI노트북 Gram Chat NPU 47 TOPS",
                "manufacturer": "LG전자",
                "model_name": "16Z90TS-GU7WK",
                "url": "test://gram2",
            },
            norm_info={"company_name": "LG전자", "model_name": "16Z90TS-GU7WK"},
            patent_items_df=pd.DataFrame([
                {
                    "source_record_id": "P-CLEAN-1",
                    "발명의명칭(한글)": "냉매 배관의 세정 장치",
                    "출원인": "LG전자",
                    "출원일자": "2025-03-01",
                    "초록": "냉매 배관에 세정액을 공급하는 기계 장치",
                }
            ]),
            target_company_name="LG전자",
            model_param="16Z90TS-GU7WK",
            ontology_dir=str(ROOT / "ontology"),
        )
        self.assertEqual(result.tes, 0.0)

    def test_dart_evidence_list_survives_bundle_and_can_raise_tes(self):
        common = dict(
            product_json={
                "title": "LG전자 그램 프로 Copilot+ PC",
                "raw_specs": "AI노트북 Gram Chat NPU 47 TOPS",
                "manufacturer": "LG전자",
                "model_name": "16Z90TS-GU7WK",
                "url": "test://dart-gram",
            },
            norm_info={"company_name": "LG전자", "model_name": "16Z90TS-GU7WK"},
            target_company_name="LG전자",
            model_param="16Z90TS-GU7WK",
            ontology_dir=str(ROOT / "ontology"),
        )
        base = secure_analyze_bundle(**common)
        dart = secure_analyze_bundle(
            dart_result={
                "status": "공시 실적 검증 완료",
                "total_score": 80,
                "evidence": [
                    "생성형 AI 및 LLM 기반 자연어 질의응답과 문서 요약 기술 연구개발",
                    "온디바이스 AI 어시스턴트 사업화",
                ],
                "detail": "LG전자 AI 연구개발 공시",
            },
            **common,
        )
        self.assertGreater(dart.tes, base.tes)

    def test_unrelated_dart_company_text_does_not_raise_tes(self):
        result = secure_analyze_bundle(
            product_json={
                "title": "LG전자 그램 프로 Copilot+ PC",
                "raw_specs": "AI노트북 Gram Chat NPU 47 TOPS",
                "manufacturer": "LG전자",
                "model_name": "16Z90TS-GU7WK",
                "url": "test://dart-unrelated",
            },
            norm_info={"company_name": "LG전자", "model_name": "16Z90TS-GU7WK"},
            dart_result={
                "status": "공시 실적 검증 완료",
                "total_score": 60,
                "evidence": ["냉장고 생산라인 설비 투자 및 물류 자동화"],
                "detail": "LG전자 사업 공시",
            },
            target_company_name="LG전자",
            model_param="16Z90TS-GU7WK",
            ontology_dir=str(ROOT / "ontology"),
        )
        self.assertEqual(result.tes, 0.0)

    def test_duplicate_patent_record_id_is_deduplicated(self):
        result = secure_analyze_bundle(
            product_json={
                "title": "LG전자 그램 프로 Copilot+ PC",
                "raw_specs": "AI노트북 Gram Chat NPU 47 TOPS",
                "manufacturer": "LG전자",
                "model_name": "16Z90TS-GU7WK",
                "url": "test://gram3",
            },
            norm_info={"company_name": "LG전자", "model_name": "16Z90TS-GU7WK"},
            patent_items_df=pd.DataFrame([
                {"source_record_id": "P-SAME", "발명의명칭(한글)": "LLM 기반 질의응답", "출원인": "LG전자"},
                {"source_record_id": "P-SAME", "발명의명칭(한글)": "LLM 기반 질의응답", "출원인": "LG전자"},
            ]),
            target_company_name="LG전자",
            model_param="16Z90TS-GU7WK",
            ontology_dir=str(ROOT / "ontology"),
        )
        audit = [x for x in result.details["evidence_audit"] if x["source_type"] == "kipris"]
        self.assertEqual(len(audit), 1)

    def test_exact_model_in_patent_becomes_direct_model(self):
        records = bundle_to_evidence_records(
            patent_items_df=pd.DataFrame([
                {
                    "source_record_id": "P-MODEL",
                    "발명의명칭(한글)": "16Z90TS-GU7WK용 생성형 AI 사용자 인터페이스",
                    "출원인": "LG전자",
                }
            ]),
            target_company_name="LG전자",
            model_param="16Z90TS-GU7WK",
        )
        patent = next(r for r in records if r.source_type == "kipris")
        self.assertTrue(patent.matched_model)
        self.assertEqual(patent.relation_type, "direct_model")


class KIPRISCollectorTests(unittest.TestCase):
    def test_verify_kipris_returns_underlying_records(self):
        # Import with a lightweight fake config so the function follows the KIPRIS path.
        fake_config = types.SimpleNamespace(KIPRIS_KEY="test-key", DATAGO_API_KEY="")
        with patch.dict(sys.modules, {"config": fake_config}):
            if "logic.api" in sys.modules:
                del sys.modules["logic.api"]
            api = importlib.import_module("logic.api")

        fake_df = pd.DataFrame([
            {
                "source_record_id": "P1",
                "발명의명칭(한글)": "생성형 AI 질의응답 방법",
                "출원인": "LG전자",
                "출원일자": "2025-01-01",
            },
            {
                "source_record_id": "P2",
                "발명의명칭(한글)": "LLM 문서 요약 방법",
                "출원인": "LG전자",
                "출원일자": "2025-02-01",
            },
        ])
        with patch.object(api, "get_company_patent_data", return_value=(7, fake_df, "일반 AI")):
            api.KIPRIS_KEY = "test-key"
            result = api.verify_kipris(["LG전자", "lg전자", "LG전자"], "노트북")
        self.assertEqual(result["count"], 7)
        self.assertEqual(result["returned_count"], 2)
        self.assertEqual(len(result["records"]), 2)
        self.assertEqual(result["records"][0]["source_record_id"], "P1")


    def test_nipa_preserves_matched_row_details(self):
        fake_config = types.SimpleNamespace(KIPRIS_KEY="", DATAGO_API_KEY="test-key")
        with patch.dict(sys.modules, {"config": fake_config}):
            if "logic.api" in sys.modules:
                del sys.modules["logic.api"]
            api = importlib.import_module("logic.api")

        class Response:
            status_code = 200
            def json(self):
                return {
                    "data": [
                        {"기업명": "LG전자", "솔루션명": "생성형 AI 문서 요약", "기술": "LLM 자연어 처리"},
                        {"기업명": "다른회사", "솔루션명": "비전 검사"},
                    ]
                }

        with patch.object(api.requests, "get", return_value=Response()):
            result = api.verify_nipa_solution(["LG전자"])
        self.assertEqual(result["score"], 20)
        self.assertEqual(len(result["records"]), 1)
        self.assertIn("LLM", str(result["records"][0]))

    def test_patent_scraper_does_not_duplicate_same_request(self):
        fake_config = types.SimpleNamespace(KIPRIS_KEY="test-key")
        with patch.dict(sys.modules, {"config": fake_config}):
            if "logic.patent_scraper" in sys.modules:
                del sys.modules["logic.patent_scraper"]
            scraper = importlib.import_module("logic.patent_scraper")

        xml = """<?xml version='1.0' encoding='UTF-8'?>
        <response><count><totalCount>1</totalCount></count><items><item>
          <indexNo>1</indexNo><applicationNumber>1020250001234</applicationNumber>
          <inventionTitle>생성형 AI 질의응답 방법</inventionTitle>
          <applicationDate>20250420</applicationDate><applicantName>LG전자</applicantName>
          <registerStatus>등록</registerStatus><astrtCont>LLM 문서 요약 및 질의응답</astrtCont>
        </item></items></response>"""

        class Response:
            text = xml
            def raise_for_status(self):
                return None

        with patch.object(scraper.requests, "get", return_value=Response()) as mocked_get:
            count, df, search_type = scraper.get_company_patent_data(
                ["LG전자"], product_keyword="노트북", service_key="test-key"
            )
        self.assertEqual(count, 1)
        self.assertEqual(mocked_get.call_count, 1)  # no duplicate request
        self.assertEqual(df.iloc[0]["출원번호"], "1020250001234")
        self.assertIn("LLM", df.iloc[0]["초록"])
        self.assertIn("노트북", search_type)

    def test_patent_scraper_fallback_is_exactly_one_extra_request(self):
        fake_config = types.SimpleNamespace(KIPRIS_KEY="test-key")
        with patch.dict(sys.modules, {"config": fake_config}):
            if "logic.patent_scraper" in sys.modules:
                del sys.modules["logic.patent_scraper"]
            scraper = importlib.import_module("logic.patent_scraper")

        xml_zero = "<response><count><totalCount>0</totalCount></count><items/></response>"
        xml_one = """<response><count><totalCount>1</totalCount></count><items><item>
          <indexNo>2</indexNo><inventionTitle>LLM 기반 요약 방법</inventionTitle>
          <applicationDate>20240101</applicationDate><applicantName>LG전자</applicantName>
          <registerStatus>등록</registerStatus></item></items></response>"""

        class Response:
            def __init__(self, text): self.text = text
            def raise_for_status(self): return None

        with patch.object(
            scraper.requests,
            "get",
            side_effect=[Response(xml_zero), Response(xml_one)],
        ) as mocked_get:
            count, df, search_type = scraper.get_company_patent_data(
                ["LG전자"], product_keyword="노트북", service_key="test-key"
            )
        self.assertEqual(count, 1)
        self.assertEqual(mocked_get.call_count, 2)
        self.assertEqual(search_type, "일반 AI")
        self.assertEqual(len(df), 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
