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
    """Single source of truth for final classification thresholds.

    Calibrated against the labeled benchmark (138 products: 107 genuine /
    31 washing) with scripts/calibrate_thresholds.py, searching thresholds and
    support_combination_power jointly because they interact.  At the chosen
    power the two classes separate cleanly -- washing sits at a median ACCS of
    0.0 (p90 also 0.0), genuine at a median of 50.3 (p25 48.3, max 72.5) -- so
    the boundary is placed in the empty band between them rather than at a
    round number.

    `normal` at 40 sits mid-plateau: every threshold from 30 to 45 scores the
    same MCC (0.749), which means the value is not balanced on a knife edge.
    `credible` was lowered because no product in the benchmark reached the old
    80, making the tier unreachable in practice.
    """

    credible: float = 70.0
    normal: float = 40.0
    suspected: float = 25.0
    # Empirically this gate only removed correctly-scored genuine products:
    # requiring even 0.10 dropped MCC from 0.749 to 0.651 and specificity from
    # 0.869 to 0.766, while no washing product came near the ACCS boundary
    # anyway.  The sufficiency metric itself needs rework -- it is dominated by
    # a `direct` term that external evidence almost never earns -- so it is left
    # non-binding for Normal rather than tuned to a value it cannot support.
    minimum_sufficiency_for_normal: float = 0.0
    # Credible is the strongest claim the system makes, so it keeps a real
    # evidence-depth requirement (genuine p75 = 0.419, max 0.794).
    minimum_sufficiency_for_credible: float = 0.35


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

    # Exponent applied to the 6-factor support product: support = product ** power.
    # power=1.0 is a strict AND of all 6 factors and compounds so fast that even a
    # flawless piece of evidence scored 0.497 -- below the 0.62 threshold a required
    # component must clear -- so no single source could ever satisfy a requirement.
    # power=1/6 would be the full geometric mean.
    #
    # 0.25 comes from the joint calibration in scripts/calibrate_thresholds.py over
    # 138 labeled products. Everything from 0.14 to 0.33 ties at the best MCC
    # (0.749), so this sits mid-plateau with margin on both sides rather than at an
    # edge that a slightly different sample could move.
    support_combination_power: float = 0.25


DEFAULT_ENGINE_CONFIG = EngineConfig()
