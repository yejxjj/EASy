from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Dict, List, Any, Optional, Tuple
import os
import re
import math

import pandas as pd


# =========================================================
# 데이터 구조
# =========================================================

@dataclass
class EvidenceRecord:
    """
    수집 결과를 분석 엔진에 넣기 위한 표준 증거 레코드
    """
    source_type: str  # kc, rra, kipris, dart, tipa, koraia, gs, nep, procurement, seller_page, ocr_text ...
    text: str = ""  # 설명 텍스트 / 검색 결과 텍스트 / 특허 제목/요약 등
    scope: str = "company"  # company | product | model | product_or_model
    title: str = ""
    meta: Dict[str, Any] = field(default_factory=dict)  # 이미 수집 파이프라인에서 정리한 힌트들
    matched_company: bool = False
    matched_product: bool = False
    matched_model: bool = False

    # 옵션: 특정 requirement/component를 이미 직접 매칭했으면 사용
    matched_components: List[str] = field(default_factory=list)


@dataclass
class CapabilityScore:
    capability_id: str
    capability_name_ko: str
    base_claim_score: float
    requirement_score: float
    source_quality_score: float
    confusion_penalty: float
    company_only_penalty: float
    scope_bonus: float
    final_score: float
    positive_claim: bool
    required_fulfillment_ratio: float
    optional_fulfillment_ratio: float
    matched_strong_patterns: List[str] = field(default_factory=list)
    matched_weak_patterns: List[str] = field(default_factory=list)
    matched_negative_patterns: List[str] = field(default_factory=list)
    supporting_sources: List[str] = field(default_factory=list)
    fulfilled_required_components: List[str] = field(default_factory=list)
    fulfilled_optional_components: List[str] = field(default_factory=list)
    missing_required_components: List[str] = field(default_factory=list)


@dataclass
class AnalysisResult:
    accs: float
    raw_accs: float
    hes: float
    tes: float
    ces: float
    ecs: float
    conf: float
    verdict: str
    risk_level: str
    top_capabilities: List[Dict[str, Any]]
    reasons: List[str]
    capability_scores: List[Dict[str, Any]]
    details: Dict[str, Any]


@dataclass
class DynamicWeightConfig:
    """
    동적 가중치 계산용 수치 설정.

    주의:
    - 이 설정은 키워드 기반이 아니다.
    - claim_text에서 특정 키워드를 다시 찾지 않고, 이미 온톨로지 분석으로 계산된
      HES/TES/CES/ECS, evidence source, scope, matched_* 메타데이터만 사용한다.
    - 추후 실험이 필요하면 이 값들을 CSV/JSON으로 분리해도 된다.
    """
    base_logit: float = 1.0

    # 각 채널 점수 자체가 높을수록 해당 채널의 반영 비중을 조금 높인다.
    channel_score_weight: float = 0.85

    # 해당 채널의 근거가 존재하면 기본 반영 비중을 높인다.
    channel_presence_bonus: float = 0.25

    # 모델/제품 단위로 직접 매칭되는 근거가 많으면 HES의 중요도가 커진다.
    product_or_model_scope_bonus: float = 0.35
    model_match_bonus: float = 0.35

    # 기술 근거는 긍정 capability의 최종 점수가 높고, 특허/공시 근거가 있을수록 중요도가 올라간다.
    technical_support_bonus: float = 0.30

    # 인증 근거는 인증 채널이 존재하면 중요도가 올라간다.
    certification_support_bonus: float = 0.30

    # 근거 채널 수가 부족할수록 ECS 중요도를 높인다.
    coverage_gap_bonus: float = 0.80

    # 특정 출처에만 몰린 경우 ECS 중요도를 높인다.
    source_concentration_bonus: float = 0.35

    # 전체 evidence가 너무 적으면 ECS 중요도를 높인다.
    low_evidence_bonus: float = 0.35

    # 회사 단위 근거만 있고 제품/모델 단위 근거가 약하면 ECS 중요도를 높인다.
    company_only_bonus: float = 0.40

    # softmax 결과가 한 채널로 지나치게 쏠리지 않도록 logit 제한
    min_logit: float = 0.10
    max_logit: float = 4.00


# =========================================================
# 공통 유틸
# =========================================================

def clamp(v: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, v))


def safe_div(a: float, b: float) -> float:
    return a / b if b else 0.0


def normalize_text(text: str) -> str:
    text = str(text or "")
    text = text.lower()
    text = re.sub(r"\s+", " ", text).strip()
    return text


def unique_keep_order(items: List[str]) -> List[str]:
    seen = set()
    out = []
    for x in items:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out


def _evidence_text(value: Any) -> str:
    """
    수집 결과가 dict/list/DataFrame/문자열 등 다양한 형태로 들어올 수 있으므로
    판정용 텍스트로 통일한다.
    """
    if value is None:
        return ""
    return normalize_text(str(value))


def _extract_status(value: Any) -> str:
    """
    수집 결과 dict에서 status/state/result/message 계열 값을 추출한다.
    없으면 빈 문자열을 반환한다.
    """
    if not isinstance(value, dict):
        return ""

    for key in ["status", "state", "result", "message", "msg"]:
        if key in value and value.get(key) is not None:
            return normalize_text(value.get(key))

    return ""


def _is_negative_lookup_result(value: Any) -> bool:
    """
    외부 수집 결과가 '근거 없음'을 의미하는 경우 True.
    이 함수는 외부 수집기의 status 값을 안전하게 걸러내기 위한 최소 방어 로직이다.
    동적 가중치 계산에는 키워드 기반 판정이 사용되지 않는다.
    """
    text = _evidence_text(value)
    status = _extract_status(value)

    negative_keywords = [
        "미등록",
        "등록되지",
        "등록 안",
        "스킵",
        "skip",
        "skipped",
        "목록 없음",
        "목록없음",
        "결과 없음",
        "검색 결과 없음",
        "데이터 없음",
        "없음",
        "해당 없음",
        "not found",
        "no result",
        "no results",
        "empty",
        "none",
        "null",
        "failed",
        "error",
    ]

    target = f"{status} {text}".strip()

    if not target:
        return True

    return any(keyword in target for keyword in negative_keywords)


def _is_positive_lookup_result(value: Any, positive_keywords: Optional[List[str]] = None) -> bool:
    """
    외부 수집 결과가 실제 긍정 근거로 볼 수 있는지 판단한다.

    중요:
    - 부정 상태이면 무조건 False
    - 긍정 키워드가 있으면 True
    - 명확한 부정이 아니고 텍스트가 충분히 있으면 True
    - 단, 빈 dict/list/string은 False
    """
    if value is None:
        return False

    if _is_negative_lookup_result(value):
        return False

    text = _evidence_text(value)
    status = _extract_status(value)

    positive_keywords = positive_keywords or []
    default_positive_keywords = [
        "등록",
        "인증",
        "확인",
        "존재",
        "검색됨",
        "found",
        "success",
        "ok",
        "valid",
        "listed",
    ]
    keywords = positive_keywords + default_positive_keywords
    target = f"{status} {text}".strip()

    if any(keyword in target for keyword in keywords):
        return True

    if isinstance(value, dict) and not value:
        return False

    if isinstance(value, list) and len(value) == 0:
        return False

    return bool(text and text not in {"{}", "[]", "none", "null"})


def _softmax_dict(logits: Dict[str, float]) -> Dict[str, float]:
    if not logits:
        return {}

    max_logit = max(logits.values())
    exp_values = {
        key: math.exp(value - max_logit)
        for key, value in logits.items()
    }
    total = sum(exp_values.values())

    if total <= 0:
        n = len(logits)
        return {key: round(1.0 / n, 4) for key in logits}

    return {
        key: round(value / total, 4)
        for key, value in exp_values.items()
    }


def _scope_strength(ev: EvidenceRecord) -> float:
    """
    근거가 어느 범위까지 직접 연결되는지 0~1로 환산한다.
    """
    scope = str(ev.scope or "").lower().strip()

    if ev.matched_model or scope == "model":
        return 1.0

    if ev.matched_product or scope in {"product", "product_or_model"}:
        return 0.75

    if ev.matched_company or scope == "company":
        return 0.45

    return 0.25


# =========================================================
# 온톨로지 로더
# =========================================================

class OntologyRepository:
    def __init__(self, ontology_dir: str):
        self.ontology_dir = ontology_dir
        self._load()

    def _read_csv(self, filename: str) -> pd.DataFrame:
        path = os.path.join(self.ontology_dir, filename)

        if not os.path.exists(path):
            raise FileNotFoundError(f"온톨로지 파일을 찾을 수 없습니다: {path}")

        return pd.read_csv(path)

    def _load(self) -> None:
        self.cap_df = self._read_csv("ai_capability_master.csv")
        self.req_df = self._read_csv("capability_requirement_master.csv")
        self.confusion_df = self._read_csv("confusion_rule_master.csv")
        self.pattern_df = self._read_csv("evidence_pattern_master.csv")
        self.req_map_df = self._read_csv("requirement_evidence_map_master.csv")
        self.source_df = self._read_csv("source_credibility_master.csv")
        self.neg_df = self._read_csv("negative_pattern_master.csv")
        self.rule_df = self._read_csv("capability_scoring_rule_master.csv")

        self.capability_map = {
            row["capability_id"]: row.to_dict()
            for _, row in self.cap_df.iterrows()
        }

        self.requirements_by_cap = {
            cap_id: grp.to_dict(orient="records")
            for cap_id, grp in self.req_df.groupby("capability_id")
        }

        self.patterns_by_cap = {
            cap_id: grp.to_dict(orient="records")
            for cap_id, grp in self.pattern_df.groupby("capability_id")
        }

        self.negative_by_cap = {
            cap_id: grp.to_dict(orient="records")
            for cap_id, grp in self.neg_df.groupby("applies_to_capability_id")
        }

        self.confusion_by_cap = {
            cap_id: grp.to_dict(orient="records")
            for cap_id, grp in self.confusion_df.groupby("capability_id")
        }

        self.req_map_by_cap = {
            cap_id: grp.to_dict(orient="records")
            for cap_id, grp in self.req_map_df.groupby("capability_id")
        }

        self.source_rule_map = {
            row["source_type"]: row.to_dict()
            for _, row in self.source_df.iterrows()
        }

        self.scoring_rule_map = {
            row["capability_id"]: row.to_dict()
            for _, row in self.rule_df.iterrows()
        }

    def get_capability_ids(self) -> List[str]:
        return list(self.capability_map.keys())

    def get_capability_name(self, capability_id: str) -> str:
        return self.capability_map.get(capability_id, {}).get("capability_name_ko", capability_id)

    def get_requirements(self, capability_id: str) -> List[Dict[str, Any]]:
        return self.requirements_by_cap.get(capability_id, [])

    def get_patterns(self, capability_id: str) -> List[Dict[str, Any]]:
        return self.patterns_by_cap.get(capability_id, [])

    def get_negative_patterns(self, capability_id: str) -> List[Dict[str, Any]]:
        return self.negative_by_cap.get(capability_id, [])

    def get_confusion_rules(self, capability_id: str) -> List[Dict[str, Any]]:
        return self.confusion_by_cap.get(capability_id, [])

    def get_requirement_maps(self, capability_id: str) -> List[Dict[str, Any]]:
        return self.req_map_by_cap.get(capability_id, [])

    def get_source_rule(self, source_type: str) -> Dict[str, Any]:
        return self.source_rule_map.get(
            source_type,
            {
                "source_type": source_type,
                "credibility_weight": 0.50,
                "directness_base_weight": 0.50,
                "update_reliability_weight": 0.50,
                "source_level": "unknown",
                "source_name_ko": source_type,
                "description_ko": "",
            },
        )

    def get_scoring_rule(self, capability_id: str) -> Dict[str, Any]:
        return self.scoring_rule_map.get(
            capability_id,
            {
                "capability_id": capability_id,
                "required_fulfillment_weight": 0.60,
                "optional_fulfillment_weight": 0.15,
                "strong_pattern_weight": 0.15,
                "weak_pattern_weight": 0.05,
                "source_quality_weight": 0.10,
                "required_threshold_for_positive": 0.70,
                "max_optional_bonus": 15,
                "confusion_penalty": 20,
                "company_only_penalty": 12,
                "product_level_bonus": 8,
                "model_level_bonus": 12,
                "min_evidence_sources_for_high_confidence": 2,
                "note_ko": "기본 규칙",
            },
        )


# =========================================================
# 분석 엔진
# =========================================================

class OntologyAnalysisEngine:
    """
    임시 점수 로직을 완전히 대체하는 온톨로지 기반 분석 엔진

    이번 수정 핵심:
    - 기존 HES/TES/CES/ECS 계산은 유지한다.
    - 기존 고정 가중치 기반 ACCS는 raw_accs로 보존한다.
    - 최종 accs는 rule-based softmax dynamic weighting으로 계산한다.
    - 동적 가중치 계산에는 새 키워드 목록을 하드코딩하지 않는다.
      이미 계산된 점수, source_type, scope, matched_* 메타데이터만 사용한다.
    """

    HES_SOURCES = {"kc", "rra"}
    TES_SOURCES = {"kipris", "dart"}
    CES_SOURCES = {"tipa", "koraia", "gs", "nep", "procurement"}

    def __init__(
        self,
        ontology_dir: str,
        dynamic_weight_config: Optional[DynamicWeightConfig] = None,
        enable_dynamic_weighting: bool = True,
    ):
        self.repo = OntologyRepository(ontology_dir)
        self.dynamic_weight_config = dynamic_weight_config or DynamicWeightConfig()
        self.enable_dynamic_weighting = enable_dynamic_weighting

    # -----------------------------------------------------
    # 공개 메인 함수
    # -----------------------------------------------------

    def analyze(
        self,
        evidence_records: List[EvidenceRecord],
        ad_text: str = "",
        ocr_text: str = "",
        extra_texts: Optional[List[str]] = None,
    ) -> AnalysisResult:
        evidence_records = evidence_records or []

        claim_text = self._build_claim_text(ad_text, ocr_text, extra_texts, evidence_records)
        capability_results = self._score_all_capabilities(evidence_records, claim_text)

        # 긍정 capability만 우선 사용
        positive_caps = [c for c in capability_results if c.positive_claim]
        used_caps = positive_caps if positive_caps else capability_results

        hes = self._aggregate_channel_score(used_caps, self.HES_SOURCES)
        tes = self._aggregate_channel_score(used_caps, self.TES_SOURCES)
        ces = self._aggregate_channel_score(used_caps, self.CES_SOURCES)

        h_found = 1 if hes > 0 else 0
        t_found = 1 if tes > 0 else 0
        c_found = 1 if ces > 0 else 0

        ecs = round(((h_found + t_found + c_found) / 3.0) * 100.0, 2)

        # 기존 고정 가중치 계산 결과는 raw_accs로 보존
        raw_accs, legacy_accs, legacy_details = self._calculate_legacy_accs(
            hes=hes,
            tes=tes,
            ces=ces,
            ecs=ecs,
            h_found=h_found,
            t_found=t_found,
            c_found=c_found,
        )

        dynamic_weighting = self._calculate_dynamic_weighting(
            hes=hes,
            tes=tes,
            ces=ces,
            ecs=ecs,
            evidence_records=evidence_records,
            used_caps=used_caps,
            h_found=h_found,
            t_found=t_found,
            c_found=c_found,
            raw_accs=legacy_accs,
        )

        if self.enable_dynamic_weighting:
            accs = dynamic_weighting["dynamic_accs"]
        else:
            accs = legacy_accs

        conf = self._calculate_confidence(used_caps, evidence_records, h_found, t_found, c_found)
        verdict, risk_level = self._decide_verdict(accs, conf, used_caps)

        top_caps = sorted(used_caps, key=lambda x: x.final_score, reverse=True)[:5]

        reasons = self._build_reasons(
            accs=accs,
            raw_accs=raw_accs,
            hes=hes,
            tes=tes,
            ces=ces,
            ecs=ecs,
            conf=conf,
            verdict=verdict,
            risk_level=risk_level,
            top_caps=top_caps,
            used_caps=used_caps,
            dynamic_weighting=dynamic_weighting if self.enable_dynamic_weighting else None,
        )

        details = {
            "claim_text": claim_text,
            "legacy_accs": legacy_accs,
            "legacy_details": legacy_details,
            "dynamic_weighting": dynamic_weighting,
            "channel_presence": {
                "hardware": h_found,
                "technical": t_found,
                "certification": c_found,
            },
            "evidence_count": len(evidence_records),
            "evidence_by_source": self._count_evidence_by_source(evidence_records),
        }

        return AnalysisResult(
            accs=accs,
            raw_accs=raw_accs,
            hes=round(hes, 2),
            tes=round(tes, 2),
            ces=round(ces, 2),
            ecs=ecs,
            conf=conf,
            verdict=verdict,
            risk_level=risk_level,
            top_capabilities=[asdict(c) for c in top_caps],
            reasons=reasons,
            capability_scores=[
                asdict(c)
                for c in sorted(capability_results, key=lambda x: x.final_score, reverse=True)
            ],
            details=details,
        )

    # -----------------------------------------------------
    # ACCS / 동적 가중치
    # -----------------------------------------------------

    def _calculate_legacy_accs(
        self,
        hes: float,
        tes: float,
        ces: float,
        ecs: float,
        h_found: int,
        t_found: int,
        c_found: int,
    ) -> Tuple[float, float, Dict[str, Any]]:
        """
        기존 코드의 고정 가중치 기반 ACCS 계산.
        - raw_accs: 존재하는 HES/TES/CES 채널만 반영한 점수
        - legacy_accs: raw_accs에 ECS를 alpha로 반영한 기존 최종 점수
        """
        wh, wt, wc = 0.35, 0.40, 0.25

        numerator = (wh * hes * h_found) + (wt * tes * t_found) + (wc * ces * c_found)
        denominator = (wh * h_found) + (wt * t_found) + (wc * c_found)

        raw_accs = round(numerator / denominator, 2) if denominator else 0.0

        alpha = 0.85
        legacy_accs = round(clamp(alpha * raw_accs + (1 - alpha) * ecs), 2)

        details = {
            "method": "legacy_fixed_weighting",
            "weights": {
                "hes": wh,
                "tes": wt,
                "ces": wc,
                "ecs_alpha": 1 - alpha,
            },
            "alpha": alpha,
            "raw_accs": raw_accs,
            "legacy_accs": legacy_accs,
        }

        return raw_accs, legacy_accs, details

    def _calculate_dynamic_weighting(
        self,
        hes: float,
        tes: float,
        ces: float,
        ecs: float,
        evidence_records: List[EvidenceRecord],
        used_caps: List[CapabilityScore],
        h_found: int,
        t_found: int,
        c_found: int,
        raw_accs: float,
    ) -> Dict[str, Any]:
        """
        HES/TES/CES/ECS를 네 개의 채널 점수로 보고 softmax 기반 동적 가중치를 계산한다.

        키워드를 새로 찾지 않는다.
        이미 온톨로지 분석에서 나온 다음 값만 사용한다.
        - HES/TES/CES/ECS 점수
        - 채널 존재 여부
        - EvidenceRecord.source_type
        - EvidenceRecord.scope
        - EvidenceRecord.matched_company/product/model
        - CapabilityScore.final_score, positive_claim, supporting_sources
        """
        context = self._extract_dynamic_weight_context(
            evidence_records=evidence_records,
            used_caps=used_caps,
            h_found=h_found,
            t_found=t_found,
            c_found=c_found,
        )

        logits = self._compute_dynamic_weight_logits(
            hes=hes,
            tes=tes,
            ces=ces,
            ecs=ecs,
            context=context,
        )

        weights = _softmax_dict(logits)

        dynamic_accs = round(
            clamp(
                weights["hes"] * hes
                + weights["tes"] * tes
                + weights["ces"] * ces
                + weights["ecs"] * ecs
            ),
            2,
        )

        explanations = self._build_dynamic_weight_explanations(
            context=context,
            weights=weights,
        )

        return {
            "enabled": self.enable_dynamic_weighting,
            "method": "rule_based_softmax_dynamic_weighting_without_keyword_matching",
            "dynamic_accs": dynamic_accs,
            "weights": weights,
            "logits": logits,
            "context": context,
            "base_scores": {
                "hes": round(hes, 2),
                "tes": round(tes, 2),
                "ces": round(ces, 2),
                "ecs": round(ecs, 2),
            },
            "score_comparison": {
                "raw_or_legacy_accs": round(float(raw_accs or 0.0), 2),
                "dynamic_accs": dynamic_accs,
                "delta": round(dynamic_accs - float(raw_accs or 0.0), 2),
            },
            "explanations": explanations,
        }

    def _extract_dynamic_weight_context(
        self,
        evidence_records: List[EvidenceRecord],
        used_caps: List[CapabilityScore],
        h_found: int,
        t_found: int,
        c_found: int,
    ) -> Dict[str, Any]:
        records = evidence_records or []
        caps = used_caps or []

        source_counts = self._count_evidence_by_source(records)
        source_diversity = len(source_counts)

        evidence_count = len(records)
        channel_count = h_found + t_found + c_found
        channel_coverage_ratio = channel_count / 3.0

        model_match_count = sum(1 for ev in records if ev.matched_model or ev.scope == "model")
        product_match_count = sum(
            1
            for ev in records
            if ev.matched_product or ev.scope in {"product", "product_or_model"}
        )
        company_match_count = sum(1 for ev in records if ev.matched_company or ev.scope == "company")

        direct_match_count = model_match_count + product_match_count
        company_only_count = max(0, company_match_count - direct_match_count)

        model_match_ratio = safe_div(model_match_count, evidence_count)
        product_or_model_ratio = safe_div(direct_match_count, evidence_count)
        company_only_ratio = safe_div(company_only_count, evidence_count)

        avg_scope_strength = (
            sum(_scope_strength(ev) for ev in records) / evidence_count
            if evidence_count
            else 0.0
        )

        positive_cap_count = sum(1 for c in caps if c.positive_claim)
        avg_positive_cap_score = (
            sum(c.final_score for c in caps if c.positive_claim) / positive_cap_count
            if positive_cap_count
            else 0.0
        )

        top_cap_score = max([c.final_score for c in caps], default=0.0)

        top_sources = set()
        for c in sorted(caps, key=lambda x: x.final_score, reverse=True)[:3]:
            top_sources.update(c.supporting_sources)

        # 특정 출처에 과도하게 몰려 있는지 계산
        if evidence_count > 0 and source_counts:
            max_source_ratio = max(source_counts.values()) / evidence_count
        else:
            max_source_ratio = 0.0

        return {
            "evidence_count": evidence_count,
            "source_diversity": source_diversity,
            "channel_count": channel_count,
            "channel_coverage_ratio": round(channel_coverage_ratio, 4),
            "model_match_ratio": round(model_match_ratio, 4),
            "product_or_model_ratio": round(product_or_model_ratio, 4),
            "company_only_ratio": round(company_only_ratio, 4),
            "avg_scope_strength": round(avg_scope_strength, 4),
            "positive_capability_count": positive_cap_count,
            "avg_positive_capability_score": round(avg_positive_cap_score, 2),
            "top_capability_score": round(top_cap_score, 2),
            "top_supporting_source_count": len(top_sources),
            "max_source_ratio": round(max_source_ratio, 4),
        }

    def _compute_dynamic_weight_logits(
        self,
        hes: float,
        tes: float,
        ces: float,
        ecs: float,
        context: Dict[str, Any],
    ) -> Dict[str, float]:
        cfg = self.dynamic_weight_config

        logits = {
            "hes": cfg.base_logit,
            "tes": cfg.base_logit,
            "ces": cfg.base_logit,
            "ecs": cfg.base_logit,
        }

        scores = {
            "hes": clamp(hes, 0.0, 100.0),
            "tes": clamp(tes, 0.0, 100.0),
            "ces": clamp(ces, 0.0, 100.0),
            "ecs": clamp(ecs, 0.0, 100.0),
        }

        # 1) 채널 점수 자체를 중요도에 반영
        for key, score in scores.items():
            logits[key] += cfg.channel_score_weight * (score / 100.0)

        # 2) 해당 채널 근거가 존재하면 기본 보너스
        if hes > 0:
            logits["hes"] += cfg.channel_presence_bonus
        if tes > 0:
            logits["tes"] += cfg.channel_presence_bonus
        if ces > 0:
            logits["ces"] += cfg.channel_presence_bonus
        if ecs > 0:
            logits["ecs"] += cfg.channel_presence_bonus

        # 3) 제품/모델 단위 근거가 많을수록 HES 중요도 증가
        product_or_model_ratio = float(context.get("product_or_model_ratio", 0.0))
        model_match_ratio = float(context.get("model_match_ratio", 0.0))
        avg_scope_strength = float(context.get("avg_scope_strength", 0.0))

        logits["hes"] += cfg.product_or_model_scope_bonus * product_or_model_ratio
        logits["hes"] += cfg.model_match_bonus * model_match_ratio
        logits["hes"] += 0.20 * avg_scope_strength

        # 4) 긍정 capability가 강하면 TES/CES가 뒷받침 역할을 하도록 보정
        avg_positive_cap_score = float(context.get("avg_positive_capability_score", 0.0))
        top_capability_score = float(context.get("top_capability_score", 0.0))
        top_supporting_source_count = int(context.get("top_supporting_source_count", 0))

        capability_signal = max(avg_positive_cap_score, top_capability_score) / 100.0

        if tes > 0:
            logits["tes"] += cfg.technical_support_bonus * capability_signal

        if ces > 0:
            logits["ces"] += cfg.certification_support_bonus * capability_signal

        # 5) supporting source가 다양할수록 TES/CES의 보조 신뢰도를 높임
        source_support_signal = min(top_supporting_source_count / 5.0, 1.0)

        logits["tes"] += 0.15 * source_support_signal
        logits["ces"] += 0.15 * source_support_signal

        # 6) 채널 커버리지가 낮거나 출처가 한쪽에 몰리면 ECS 중요도 증가
        channel_coverage_ratio = float(context.get("channel_coverage_ratio", 0.0))
        max_source_ratio = float(context.get("max_source_ratio", 0.0))
        evidence_count = int(context.get("evidence_count", 0))
        company_only_ratio = float(context.get("company_only_ratio", 0.0))

        logits["ecs"] += cfg.coverage_gap_bonus * (1.0 - channel_coverage_ratio)

        if max_source_ratio >= 0.70:
            logits["ecs"] += cfg.source_concentration_bonus

        if evidence_count <= 2:
            logits["ecs"] += cfg.low_evidence_bonus

        logits["ecs"] += cfg.company_only_bonus * company_only_ratio

        return {
            key: round(clamp(value, cfg.min_logit, cfg.max_logit), 4)
            for key, value in logits.items()
        }

    def _build_dynamic_weight_explanations(
        self,
        context: Dict[str, Any],
        weights: Dict[str, float],
    ) -> List[str]:
        explanations = []

        if not weights:
            return explanations

        channel_names = {
            "hes": "하드웨어 근거 점수(HES)",
            "tes": "기술 근거 점수(TES)",
            "ces": "인증 근거 점수(CES)",
            "ecs": "근거 커버리지 점수(ECS)",
        }

        top_channel = max(weights, key=weights.get)
        explanations.append(
            f"동적 가중치 기준으로 {channel_names.get(top_channel, top_channel)}의 반영 비중이 가장 높게 산출되었습니다."
        )

        if float(context.get("channel_coverage_ratio", 0.0)) < 1.0:
            explanations.append(
                "HES/TES/CES 중 일부 근거 채널이 부족하여 ECS가 근거 커버리지 보정 역할을 수행했습니다."
            )

        if int(context.get("evidence_count", 0)) <= 2:
            explanations.append(
                "전체 근거 수가 적어 단일 근거에 과도하게 의존하지 않도록 동적 가중치를 조정했습니다."
            )

        if float(context.get("max_source_ratio", 0.0)) >= 0.70:
            explanations.append(
                "근거가 특정 출처에 집중되어 있어 출처 편중 위험을 ECS에 반영했습니다."
            )

        if float(context.get("product_or_model_ratio", 0.0)) > 0.0:
            explanations.append(
                "제품 또는 모델 단위로 연결되는 근거가 확인되어 HES 반영 비중을 보정했습니다."
            )

        if float(context.get("company_only_ratio", 0.0)) > 0.0:
            explanations.append(
                "회사 단위 근거가 포함되어 있어 해당 상품에 직접 연결되는 근거인지 확인하도록 보정했습니다."
            )

        return unique_keep_order(explanations)

    # -----------------------------------------------------
    # Capability별 점수 계산
    # -----------------------------------------------------

    def _score_all_capabilities(
        self,
        evidence_records: List[EvidenceRecord],
        claim_text: str,
    ) -> List[CapabilityScore]:
        scores: List[CapabilityScore] = []

        for cap_id in self.repo.get_capability_ids():
            scores.append(self._score_one_capability(cap_id, evidence_records, claim_text))

        return scores

    def _score_one_capability(
        self,
        capability_id: str,
        evidence_records: List[EvidenceRecord],
        claim_text: str,
    ) -> CapabilityScore:
        cap_name = self.repo.get_capability_name(capability_id)
        scoring_rule = self.repo.get_scoring_rule(capability_id)

        # 1) claim pattern 매칭
        strong_patterns, weak_patterns = self._match_positive_patterns(capability_id, claim_text)
        negative_patterns = self._match_negative_patterns(capability_id, claim_text)

        strong_hits = len(strong_patterns)
        weak_hits = len(weak_patterns)

        strong_pattern_score = min(100.0, strong_hits * 35.0)
        weak_pattern_score = min(100.0, weak_hits * 20.0)

        base_claim_score = (
            strong_pattern_score * float(scoring_rule["strong_pattern_weight"])
            + weak_pattern_score * float(scoring_rule["weak_pattern_weight"])
        ) / max(
            1e-9,
            float(scoring_rule["strong_pattern_weight"])
            + float(scoring_rule["weak_pattern_weight"]),
        )

        # 2) requirement fulfillment
        req_score_info = self._calculate_requirement_score(capability_id, evidence_records)

        # 3) source quality
        source_quality_score = self._calculate_source_quality(req_score_info["supporting_evidence"])

        # 4) penalty / bonus
        confusion_penalty = 0.0

        if negative_patterns:
            base_penalty = float(scoring_rule["confusion_penalty"])
            penalty_ratio = min(1.0, sum(p["penalty_weight"] for p in negative_patterns))
            confusion_penalty = base_penalty * penalty_ratio

        scope_bonus = 0.0
        company_only_penalty = 0.0

        scope_types = {ev.scope for ev in req_score_info["supporting_evidence"]}

        if "model" in scope_types:
            scope_bonus += float(scoring_rule["model_level_bonus"])
        elif "product" in scope_types or "product_or_model" in scope_types:
            scope_bonus += float(scoring_rule["product_level_bonus"])
        elif scope_types == {"company"} and req_score_info["supporting_evidence"]:
            company_only_penalty += float(scoring_rule["company_only_penalty"])

        # 5) 최종 capability score
        required_weight = float(scoring_rule["required_fulfillment_weight"])
        optional_weight = float(scoring_rule["optional_fulfillment_weight"])
        quality_weight = float(scoring_rule["source_quality_weight"])

        req_component_score = (
            req_score_info["required_ratio"] * 100.0 * required_weight
            + req_score_info["optional_ratio"] * 100.0 * optional_weight
            + source_quality_score * quality_weight
        ) / max(1e-9, required_weight + optional_weight + quality_weight)

        final_score = clamp(
            0.45 * base_claim_score
            + 0.55 * req_component_score
            - confusion_penalty
            - company_only_penalty
            + scope_bonus
        )

        required_threshold = float(scoring_rule["required_threshold_for_positive"])

        positive_claim = (
            (strong_hits > 0 or weak_hits > 0)
            and req_score_info["required_ratio"] >= required_threshold * 0.5
        )

        return CapabilityScore(
            capability_id=capability_id,
            capability_name_ko=cap_name,
            base_claim_score=round(base_claim_score, 2),
            requirement_score=round(req_component_score, 2),
            source_quality_score=round(source_quality_score, 2),
            confusion_penalty=round(confusion_penalty, 2),
            company_only_penalty=round(company_only_penalty, 2),
            scope_bonus=round(scope_bonus, 2),
            final_score=round(final_score, 2),
            positive_claim=positive_claim,
            required_fulfillment_ratio=round(req_score_info["required_ratio"], 4),
            optional_fulfillment_ratio=round(req_score_info["optional_ratio"], 4),
            matched_strong_patterns=strong_patterns,
            matched_weak_patterns=weak_patterns,
            matched_negative_patterns=[p["pattern_text_ko"] for p in negative_patterns],
            supporting_sources=unique_keep_order(
                [ev.source_type for ev in req_score_info["supporting_evidence"]]
            ),
            fulfilled_required_components=req_score_info["fulfilled_required_components"],
            fulfilled_optional_components=req_score_info["fulfilled_optional_components"],
            missing_required_components=req_score_info["missing_required_components"],
        )

    # -----------------------------------------------------
    # 텍스트/패턴
    # -----------------------------------------------------

    def _build_claim_text(
        self,
        ad_text: str,
        ocr_text: str,
        extra_texts: Optional[List[str]],
        evidence_records: List[EvidenceRecord],
    ) -> str:
        parts = [ad_text or "", ocr_text or ""]

        if extra_texts:
            parts.extend(extra_texts)

        for ev in evidence_records:
            if ev.source_type in {"seller_page", "ocr_text", "product_text"} and ev.text:
                parts.append(ev.text)

        return normalize_text(" ".join(parts))

    def _match_positive_patterns(
        self,
        capability_id: str,
        claim_text: str,
    ) -> Tuple[List[str], List[str]]:
        strong, weak = [], []

        for row in self.repo.get_patterns(capability_id):
            pattern = normalize_text(row.get("pattern_text_ko", ""))

            if pattern and pattern in claim_text:
                if str(row.get("evidence_strength", "")).lower() == "strong":
                    strong.append(row["pattern_text_ko"])
                else:
                    weak.append(row["pattern_text_ko"])

        return unique_keep_order(strong), unique_keep_order(weak)

    def _match_negative_patterns(
        self,
        capability_id: str,
        claim_text: str,
    ) -> List[Dict[str, Any]]:
        matched = []

        for row in self.repo.get_negative_patterns(capability_id):
            pattern = normalize_text(row.get("pattern_text_ko", ""))

            if pattern and pattern in claim_text:
                matched.append(row)

        return matched

    # -----------------------------------------------------
    # Requirement / evidence 매핑
    # -----------------------------------------------------

    def _calculate_requirement_score(
        self,
        capability_id: str,
        evidence_records: List[EvidenceRecord],
    ) -> Dict[str, Any]:
        requirements = self.repo.get_requirements(capability_id)
        req_maps = self.repo.get_requirement_maps(capability_id)

        required_components = []
        optional_components = []
        fulfilled_required = []
        fulfilled_optional = []
        supporting_evidence: List[EvidenceRecord] = []

        for req in requirements:
            comp_name = req["component_name_ko"]
            required_level = str(req["required_level"]).lower().strip()

            matched_evidence = self._find_evidence_for_requirement(
                capability_id,
                comp_name,
                required_level,
                req_maps,
                evidence_records,
            )

            if required_level == "required":
                required_components.append(comp_name)

                if matched_evidence:
                    fulfilled_required.append(comp_name)
                    supporting_evidence.extend(matched_evidence)
            else:
                optional_components.append(comp_name)

                if matched_evidence:
                    fulfilled_optional.append(comp_name)
                    supporting_evidence.extend(matched_evidence)

        supporting_evidence = self._dedup_evidence(supporting_evidence)

        required_ratio = safe_div(len(fulfilled_required), len(required_components))
        optional_ratio = safe_div(len(fulfilled_optional), len(optional_components))

        return {
            "required_ratio": required_ratio,
            "optional_ratio": optional_ratio,
            "fulfilled_required_components": fulfilled_required,
            "fulfilled_optional_components": fulfilled_optional,
            "missing_required_components": [
                c for c in required_components if c not in fulfilled_required
            ],
            "supporting_evidence": supporting_evidence,
        }

    def _find_evidence_for_requirement(
        self,
        capability_id: str,
        component_name: str,
        required_level: str,
        req_maps: List[Dict[str, Any]],
        evidence_records: List[EvidenceRecord],
    ) -> List[EvidenceRecord]:
        matched = []

        candidate_maps = [
            m
            for m in req_maps
            if m["component_name_ko"] == component_name
            and str(m["required_level"]).lower().strip() == required_level
        ]

        for ev in evidence_records:
            ev_text = normalize_text(ev.text)

            for m in candidate_maps:
                if ev.source_type != m["acceptable_evidence_source"]:
                    continue

                min_strength = str(m.get("minimum_strength", "weak")).lower().strip()

                if min_strength == "strong":
                    if not self._match_requirement_strong(component_name, ev, ev_text):
                        continue
                else:
                    if not self._match_requirement_weak(component_name, ev, ev_text):
                        continue

                if not self._scope_compatible(m.get("match_scope", ""), ev.scope):
                    continue

                matched.append(ev)

        return self._dedup_evidence(matched)

    def _match_requirement_strong(
        self,
        component_name: str,
        ev: EvidenceRecord,
        ev_text: str,
    ) -> bool:
        """
        하드코딩된 component alias를 사용하지 않는다.
        1순위: 수집 파이프라인에서 matched_components로 넘겨준 구조화 정보
        2순위: 온톨로지의 component_name 자체가 evidence text에 포함되는 경우
        3순위: 제품/모델 단위 매칭 여부
        """
        component_token = normalize_text(component_name)

        if component_name in ev.matched_components:
            return True

        if component_token and component_token in ev_text:
            return True

        if ev.matched_model or ev.matched_product:
            return True

        return False

    def _match_requirement_weak(
        self,
        component_name: str,
        ev: EvidenceRecord,
        ev_text: str,
    ) -> bool:
        """
        하드코딩된 component alias를 사용하지 않는다.
        """
        component_token = normalize_text(component_name)

        if component_name in ev.matched_components:
            return True

        if component_token and component_token in ev_text:
            return True

        if ev.matched_company or ev.matched_product or ev.matched_model:
            return True

        return False

    def _scope_compatible(self, required_scope: str, ev_scope: str) -> bool:
        required_scope = str(required_scope or "").strip().lower()
        ev_scope = str(ev_scope or "").strip().lower()

        if required_scope == "" or required_scope == "any":
            return True

        if required_scope == ev_scope:
            return True

        if required_scope == "product_or_model" and ev_scope in {"product", "model", "product_or_model"}:
            return True

        if required_scope == "product" and ev_scope in {"product", "model"}:
            return True

        return False

    def _dedup_evidence(self, records: List[EvidenceRecord]) -> List[EvidenceRecord]:
        out = []
        seen = set()

        for ev in records:
            key = (ev.source_type, ev.scope, ev.title, ev.text[:100])

            if key not in seen:
                seen.add(key)
                out.append(ev)

        return out

    # -----------------------------------------------------
    # source quality / channel aggregate
    # -----------------------------------------------------

    def _calculate_source_quality(self, evidences: List[EvidenceRecord]) -> float:
        if not evidences:
            return 0.0

        vals = []

        for ev in evidences:
            rule = self.repo.get_source_rule(ev.source_type)

            credibility = float(rule["credibility_weight"])
            directness = float(rule["directness_base_weight"])
            update_rel = float(rule["update_reliability_weight"])

            scope_bonus = 0.0

            if ev.scope == "model":
                scope_bonus += 0.08
            elif ev.scope in {"product", "product_or_model"}:
                scope_bonus += 0.05

            if ev.matched_model:
                scope_bonus += 0.08
            elif ev.matched_product:
                scope_bonus += 0.05

            val = clamp(
                (
                    credibility * 0.45
                    + directness * 0.35
                    + update_rel * 0.20
                    + scope_bonus
                )
                * 100.0
            )

            vals.append(val)

        return round(sum(vals) / len(vals), 2)

    def _aggregate_channel_score(self, caps: List[CapabilityScore], source_pool: set) -> float:
        channel_caps = [c for c in caps if set(c.supporting_sources) & source_pool]

        if not channel_caps:
            return 0.0

        top = sorted(channel_caps, key=lambda x: x.final_score, reverse=True)[:3]

        return round(sum(c.final_score for c in top) / len(top), 2)

    def _calculate_confidence(
        self,
        caps: List[CapabilityScore],
        evidence_records: List[EvidenceRecord],
        h_found: int,
        t_found: int,
        c_found: int,
    ) -> float:
        if not caps:
            return 0.0

        positive_caps = [c for c in caps if c.positive_claim]
        top = sorted(caps, key=lambda x: x.final_score, reverse=True)[:3]

        channel_factor = ((h_found + t_found + c_found) / 3.0) * 35.0
        evidence_factor = min(len(evidence_records) / 12.0, 1.0) * 20.0
        capability_factor = min(len(positive_caps) / 3.0, 1.0) * 15.0
        score_factor = (sum(c.final_score for c in top) / max(1, len(top))) * 0.20
        support_source_factor = (
            min(len(set(s for c in top for s in c.supporting_sources)) / 5.0, 1.0)
            * 10.0
        )

        conf = clamp(
            channel_factor
            + evidence_factor
            + capability_factor
            + score_factor
            + support_source_factor
        )

        return round(conf, 2)

    # -----------------------------------------------------
    # verdict / reason
    # -----------------------------------------------------

    def _decide_verdict(
        self,
        accs: float,
        conf: float,
        caps: List[CapabilityScore],
    ) -> Tuple[str, str]:
        positive_top = [
            c
            for c in sorted(caps, key=lambda x: x.final_score, reverse=True)
            if c.positive_claim
        ][:3]

        if not positive_top and accs < 70:
            return "불확실", "중간"

        if accs >= 80 and conf >= 65:
            return "신뢰 가능", "낮음"

        if accs >= 60 and conf >= 50:
            return "추가 검토 필요", "중간"

        if accs >= 40:
            return "근거 부족", "중간~높음"

        return "AI Washing 의심", "높음"

    def _build_reasons(
        self,
        accs: float,
        raw_accs: float,
        hes: float,
        tes: float,
        ces: float,
        ecs: float,
        conf: float,
        verdict: str,
        risk_level: str,
        top_caps: List[CapabilityScore],
        used_caps: List[CapabilityScore],
        dynamic_weighting: Optional[Dict[str, Any]] = None,
    ) -> List[str]:
        reasons = []

        if dynamic_weighting:
            comparison = dynamic_weighting.get("score_comparison", {})
            reasons.append(
                f"동적 가중치 기반 최종 ACCS는 {accs:.1f}점이며, "
                f"기존 고정 가중치 기준 점수는 {comparison.get('raw_or_legacy_accs', raw_accs):.1f}점입니다."
            )

            weights = dynamic_weighting.get("weights", {})
            if weights:
                reasons.append(
                    "동적 가중치는 "
                    f"HES {weights.get('hes', 0):.3f}, "
                    f"TES {weights.get('tes', 0):.3f}, "
                    f"CES {weights.get('ces', 0):.3f}, "
                    f"ECS {weights.get('ecs', 0):.3f}로 계산되었습니다."
                )
        else:
            reasons.append(
                f"온톨로지 기반 최종 ACCS는 {accs:.1f}점이며, "
                f"존재 채널만 반영한 Raw ACCS는 {raw_accs:.1f}점입니다."
            )

        reasons.append(
            f"HES {hes:.1f}점, TES {tes:.1f}점, CES {ces:.1f}점, "
            f"ECS {ecs:.1f}점, CONF {conf:.1f}점으로 계산되었습니다."
        )

        if top_caps:
            cap_desc = ", ".join(
                [f"{c.capability_name_ko}({c.final_score:.1f})" for c in top_caps[:3]]
            )
            reasons.append(f"가장 강하게 뒷받침된 capability는 {cap_desc} 입니다.")

        missing_heavy = []

        for c in used_caps[:5]:
            if c.missing_required_components and c.positive_claim:
                missing_heavy.append(
                    f"{c.capability_name_ko}: {', '.join(c.missing_required_components[:2])}"
                )

        if missing_heavy:
            reasons.append(
                "주장 기능 대비 일부 필수 requirement가 부족했습니다: "
                + " / ".join(missing_heavy[:3])
            )

        if dynamic_weighting:
            reasons.extend(dynamic_weighting.get("explanations", [])[:3])

        reasons.append(f"최종 판정은 '{verdict}', 위험도는 '{risk_level}'입니다.")

        return unique_keep_order(reasons)

    def _count_evidence_by_source(
        self,
        evidence_records: List[EvidenceRecord],
    ) -> Dict[str, int]:
        result: Dict[str, int] = {}

        for ev in evidence_records:
            result[ev.source_type] = result.get(ev.source_type, 0) + 1

        return dict(sorted(result.items(), key=lambda x: x[0]))


# =========================================================
# feature_scraper 브랜치용 adapter helper
# =========================================================

def bundle_to_evidence_records(
    product_json: Optional[Dict[str, Any]] = None,
    norm_info: Optional[Dict[str, Any]] = None,
    db_results: Optional[List[Dict[str, Any]]] = None,
    jodale_result: Optional[Any] = None,
    tipa_result: Optional[Any] = None,
    koraia_result: Optional[Any] = None,
    patent_items_df: Optional[Any] = None,
    cert_results: Optional[List[Dict[str, Any]]] = None,
    dart_result: Optional[Dict[str, Any]] = None,
    target_company_name: str = "",
    model_param: str = "",
) -> List[EvidenceRecord]:
    """
    feature_scraper 브랜치의 수집 결과를 분석 엔진 입력으로 변환

    유지한 수정 사항:
    - 조달청 / TIPA / KORAIA에서 미등록, 스킵, 목록 없음, not found 등은 EvidenceRecord로 추가하지 않는다.
    - 실제 긍정 근거가 있는 경우에만 CES source로 들어가도록 한다.
    - 조달청 결과에서 matched_product=True를 무조건 주지 않는다.
    """
    records: List[EvidenceRecord] = []

    # 1) seller page / product text
    if product_json:
        seller_text_parts = []

        for key in [
            "name",
            "product_name",
            "title",
            "description",
            "spec_summary",
            "ocr_text",
            "refined_text",
        ]:
            val = product_json.get(key)

            if isinstance(val, str) and val.strip():
                seller_text_parts.append(val)

        specs = product_json.get("specs")

        if isinstance(specs, dict):
            for k, v in specs.items():
                seller_text_parts.append(f"{k}: {v}")

        if seller_text_parts:
            text = " ".join(seller_text_parts)

            records.append(
                EvidenceRecord(
                    source_type="seller_page",
                    text=text,
                    scope="product" if model_param else "product_or_model",
                    title=product_json.get("name", "") or product_json.get("product_name", ""),
                    matched_company=bool(target_company_name),
                    matched_product=True,
                    matched_model=bool(model_param),
                )
            )

    # 2) KC / RRA DB results
    for row in db_results or []:
        source_type = "kc"
        title = str(row.get("product_name") or row.get("title") or "KC/RRA DB")
        text = " ".join([str(v) for v in row.values() if v is not None])

        model_match = bool(model_param and model_param.lower() in text.lower())
        company_match = bool(target_company_name and target_company_name.lower() in text.lower())

        records.append(
            EvidenceRecord(
                source_type=source_type,
                text=text,
                scope="model" if model_match else "product",
                title=title,
                matched_company=company_match,
                matched_product=True,
                matched_model=model_match,
                # component alias는 분석 엔진에 하드코딩하지 않는다.
                # 필요한 경우 수집 파이프라인에서 matched_components를 채워서 넘긴다.
                matched_components=[],
            )
        )

    # 3) procurement / 조달청
    if _is_positive_lookup_result(
        jodale_result,
        positive_keywords=["등록", "조달", "나라장터", "g2b", "procurement"],
    ):
        txt = str(jodale_result)
        model_match = bool(model_param and model_param.lower() in txt.lower())
        company_match = bool(target_company_name and target_company_name.lower() in txt.lower())

        records.append(
            EvidenceRecord(
                source_type="procurement",
                text=txt,
                scope="product" if model_param else "company",
                title="조달청 결과",
                meta={"raw_status": _extract_status(jodale_result)},
                matched_company=company_match,
                matched_product=True if model_match else bool(_extract_status(jodale_result)),
                matched_model=model_match,
            )
        )

    # 4) TIPA
    if _is_positive_lookup_result(
        tipa_result,
        positive_keywords=["인증기업", "선정", "등록", "tipa", "이노비즈", "메인비즈"],
    ):
        txt = str(tipa_result)
        company_match = bool(target_company_name and target_company_name.lower() in txt.lower())

        records.append(
            EvidenceRecord(
                source_type="tipa",
                text=txt,
                scope="company",
                title="TIPA 결과",
                meta={"raw_status": _extract_status(tipa_result)},
                matched_company=company_match,
            )
        )

    # 5) KORAIA
    if _is_positive_lookup_result(
        koraia_result,
        positive_keywords=["인증기업", "회원사", "협회", "등록", "koraia", "로봇"],
    ):
        txt = str(koraia_result)
        company_match = bool(target_company_name and target_company_name.lower() in txt.lower())

        records.append(
            EvidenceRecord(
                source_type="koraia",
                text=txt,
                scope="company",
                title="KORAIA 결과",
                meta={"raw_status": _extract_status(koraia_result)},
                matched_company=company_match,
            )
        )

    # 6) 특허
    if patent_items_df is not None:
        try:
            patent_rows = patent_items_df.to_dict(orient="records")
        except Exception:
            patent_rows = []

        for row in patent_rows:
            txt = " ".join([str(v) for v in row.values() if v is not None])

            records.append(
                EvidenceRecord(
                    source_type="kipris",
                    text=txt,
                    scope="company",
                    title=str(row.get("발명의명칭") or row.get("title") or "특허"),
                    matched_company=bool(
                        target_company_name and target_company_name.lower() in txt.lower()
                    ),
                    matched_model=bool(model_param and model_param.lower() in txt.lower()),
                )
            )

    # 7) 인증
    for row in cert_results or []:
        # 인증 결과도 미등록/결과 없음이면 CES 근거로 넣지 않음
        if not _is_positive_lookup_result(
            row,
            positive_keywords=["인증", "gs", "nep", "cert", "certificate", "등록", "확인"],
        ):
            continue

        txt = " ".join([str(v) for v in row.values() if v is not None])
        cert_name = normalize_text(txt)

        if "gs" in cert_name:
            source = "gs"
        elif "nep" in cert_name:
            source = "nep"
        else:
            source = "gs"

        records.append(
            EvidenceRecord(
                source_type=source,
                text=txt,
                scope="product",
                title=str(row.get("name") or row.get("title") or "인증"),
                matched_company=bool(
                    target_company_name and target_company_name.lower() in txt.lower()
                ),
                matched_product=True,
                matched_model=bool(model_param and model_param.lower() in txt.lower()),
            )
        )

    # 8) DART
    if dart_result:
        txt = str(dart_result)

        records.append(
            EvidenceRecord(
                source_type="dart",
                text=txt,
                scope="company",
                title="DART 공시",
                matched_company=True if target_company_name else False,
            )
        )

    return records


def analyze_feature_scraper_bundle(
    ontology_dir: str,
    product_json: Optional[Dict[str, Any]] = None,
    norm_info: Optional[Dict[str, Any]] = None,
    db_results: Optional[List[Dict[str, Any]]] = None,
    jodale_result: Optional[Any] = None,
    tipa_result: Optional[Any] = None,
    koraia_result: Optional[Any] = None,
    patent_items_df: Optional[Any] = None,
    cert_results: Optional[List[Dict[str, Any]]] = None,
    dart_result: Optional[Dict[str, Any]] = None,
    target_company_name: str = "",
    model_param: str = "",
    enable_dynamic_weighting: bool = True,
) -> AnalysisResult:
    records = bundle_to_evidence_records(
        product_json=product_json,
        norm_info=norm_info,
        db_results=db_results,
        jodale_result=jodale_result,
        tipa_result=tipa_result,
        koraia_result=koraia_result,
        patent_items_df=patent_items_df,
        cert_results=cert_results,
        dart_result=dart_result,
        target_company_name=target_company_name,
        model_param=model_param,
    )

    ad_text = ""
    ocr_text = ""

    if product_json:
        ad_text = str(
            product_json.get("description")
            or product_json.get("name")
            or product_json.get("product_name")
            or ""
        )
        ocr_text = str(product_json.get("ocr_text") or product_json.get("refined_text") or "")

    engine = OntologyAnalysisEngine(
        ontology_dir=ontology_dir,
        enable_dynamic_weighting=enable_dynamic_weighting,
    )

    return engine.analyze(records, ad_text=ad_text, ocr_text=ocr_text)


# =========================================================
# server.py 연동 예시
# =========================================================

SERVER_INTEGRATION_EXAMPLE = r"""
# server.py 예시

from analysis_engine import analyze_feature_scraper_bundle

analysis_result = analyze_feature_scraper_bundle(
    ontology_dir=os.path.dirname(os.path.abspath(__file__)),
    product_json=product_json,
    norm_info=norm_info,
    db_results=db_results,
    jodale_result=jodale_result,
    tipa_result=tipa_result,
    koraia_result=koraia_result,
    patent_items_df=patent_items_df,
    cert_results=cert_results,
    dart_result=dart_result,
    target_company_name=target_company_name,
    model_param=model_param,
    enable_dynamic_weighting=True,
)

result = {
    "scores": {
        "ACCS": analysis_result.accs,
        "RawACCS": analysis_result.raw_accs,
        "HES": analysis_result.hes,
        "TES": analysis_result.tes,
        "CES": analysis_result.ces,
        "ECS": analysis_result.ecs,
        "CONF": analysis_result.conf,
    },
    "verdict": analysis_result.verdict,
    "risk_level": analysis_result.risk_level,
    "reasons": analysis_result.reasons,
    "top_capabilities": analysis_result.top_capabilities,
    "capability_scores": analysis_result.capability_scores,
    "details": analysis_result.details,
}
"""
