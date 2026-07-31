"""Fides rule-based baseline configuration.

The constants in this module are intentionally separated from the analysis
implementation so the same thresholds are used by the engine, API, benchmark,
and UI integration code.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict


@dataclass(frozen=True)
class VerdictThresholds:
    """Single source of truth for final classification thresholds."""

    credible: float = 80.0
    normal: float = 60.0
    suspected: float = 45.0
    minimum_sufficiency_for_normal: float = 0.45
    minimum_sufficiency_for_credible: float = 0.65


@dataclass(frozen=True)
class RelationWeights:
    """Maximum contribution of evidence according to entity relation.

    Company-level evidence is deliberately retained because a company may reuse
    technology developed for another product. It is, however, indirect evidence
    and therefore cannot be treated as equivalent to an exact model match.
    """

    direct_model: float = 1.00
    direct_product: float = 0.90
    product_family: float = 0.75
    company_capability: float = 0.55
    company_general: float = 0.18
    unmatched: float = 0.00


@dataclass(frozen=True)
class DynamicWeightConfig:
    """Rule-based dynamic weighting used before the attention-model stage."""

    base_channel_priors: Dict[str, float] = field(
        default_factory=lambda: {"hes": 0.35, "tes": 0.40, "ces": 0.25}
    )
    directness_signal: float = 0.80
    diversity_signal: float = 0.45
    count_signal: float = 0.25
    recency_signal: float = 0.20
    concentration_penalty: float = 0.30
    evidence_alpha: float = 0.85
    ecs_alpha: float = 0.15


@dataclass(frozen=True)
class EngineConfig:
    thresholds: VerdictThresholds = field(default_factory=VerdictThresholds)
    relation_weights: RelationWeights = field(default_factory=RelationWeights)
    dynamic_weights: DynamicWeightConfig = field(default_factory=DynamicWeightConfig)

    # A single company-level source must not fully prove a required component.
    company_single_source_cap: float = 0.55
    company_multi_source_cap: float = 0.78
    fulfilled_component_threshold: float = 0.62
    strong_component_threshold: float = 0.60
    weak_component_threshold: float = 0.34

    # Seller claims can support a product-level statement, but are not an
    # independent external verification source.
    seller_page_quality_cap: float = 0.55

    # Deduplicated evidence limit used for each channel aggregate.
    max_channel_evidence: int = 6


DEFAULT_ENGINE_CONFIG = EngineConfig()
