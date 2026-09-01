#!/usr/bin/env python3
"""Jointly calibrate support_combination_power and the verdict thresholds.

The three knobs interact -- raising `power` lifts every ACCS, which changes
which verdict threshold separates genuine from washing, which in turn changes
how binding the sufficiency gate is -- so tuning them one at a time lands on a
local optimum. This searches them together against the labeled benchmark,
reusing the evidence bundles pipeline_main caches under dataset/evidence_cache/
so no crawling or paid API call is repeated.

Usage:
    python scripts/calibrate_thresholds.py dataset/benchmark_sample_full.csv
"""
from __future__ import annotations

import argparse
import glob
import json
import math
import sys
from dataclasses import replace
from pathlib import Path

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from fides_config import DEFAULT_ENGINE_CONFIG  # noqa: E402
from analysis_engine import OntologyAnalysisEngine, bundle_to_evidence_records  # noqa: E402
from fides_integration import build_claim_inputs  # noqa: E402

POWERS = (1.0, 0.7, 0.5, 0.4, 0.33, 0.28, 0.25, 0.2, 0.167, 0.14)
NORMAL_THRESHOLDS = (30.0, 35.0, 40.0, 45.0, 50.0, 55.0, 60.0, 65.0, 70.0)
SUFFICIENCY_THRESHOLDS = (0.0, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.45)


def normalize_label(value: str) -> str:
    text = str(value or "").strip().lower()
    if text in {"genuine", "normal", "정상", "credible"}:
        return "normal"
    if text in {"washing", "워싱", "ai_washing", "suspicious", "의심", "suspected"}:
        return "washing"
    return text


def load_bundles(labels: dict[str, str]):
    bundles = []
    for path in glob.glob(str(REPO_ROOT / "dataset" / "evidence_cache" / "*.json")):
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
        label = normalize_label(labels.get(data["url"], ""))
        if label in ("normal", "washing"):
            bundles.append((data["url"], label, data["bundle_kwargs"]))
    return bundles


def score_all(bundles, power: float, ontology_dir: str):
    """Return (label, accs, sufficiency) per product for one power value."""
    engine = OntologyAnalysisEngine(
        ontology_dir,
        engine_config=replace(DEFAULT_ENGINE_CONFIG, support_combination_power=power),
    )
    scored = []
    for _url, label, kwargs in bundles:
        product_json = kwargs.get("product_json") or {}
        norm_info = kwargs.get("norm_info") or {}
        records = bundle_to_evidence_records(
            product_json=product_json,
            norm_info=norm_info,
            db_results=kwargs.get("db_results"),
            jodale_result=kwargs.get("jodale_result"),
            tipa_result=kwargs.get("tipa_result"),
            koraia_result=kwargs.get("koraia_result"),
            kaiac_result=kwargs.get("kaiac_result"),
            nipa_result=kwargs.get("nipa_result"),
            patent_items_df=kwargs.get("patent_items_df"),
            cert_results=kwargs.get("cert_results"),
            dart_result=kwargs.get("dart_result"),
            target_company_name=kwargs.get("target_company_name", ""),
            model_param=kwargs.get("model_param", ""),
        )
        ad_text, ocr_text, extra = build_claim_inputs(
            product_json, norm_info, kwargs.get("ocr_result")
        )
        result = engine.analyze(records, ad_text=ad_text, ocr_text=ocr_text, extra_texts=extra)
        scored.append((label, result.accs, float(result.details["evidence_sufficiency"])))
    return scored


def metrics(scored, normal_threshold: float, sufficiency_threshold: float):
    """A product is predicted "normal" only when it clears both gates."""
    tp = tn = fp = fn = 0
    for label, accs, sufficiency in scored:
        predicted_normal = accs >= normal_threshold and sufficiency >= sufficiency_threshold
        if label == "washing" and not predicted_normal:
            tp += 1
        elif label == "normal" and predicted_normal:
            tn += 1
        elif label == "normal" and not predicted_normal:
            fp += 1
        else:
            fn += 1
    total = tp + tn + fp + fn
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    specificity = tn / (tn + fp) if (tn + fp) else 0.0
    denominator = math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn))
    return {
        "tp": tp, "tn": tn, "fp": fp, "fn": fn,
        "accuracy": (tp + tn) / total if total else 0.0,
        "balanced_accuracy": (recall + specificity) / 2.0,
        "washing_recall": recall,
        "specificity": specificity,
        "mcc": (tp * tn - fp * fn) / denominator if denominator else 0.0,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv", type=Path)
    parser.add_argument("--label-col", default="label")
    parser.add_argument("--ontology-dir", default=str(REPO_ROOT / "ontology"))
    parser.add_argument("--top", type=int, default=15)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    frame = pd.read_csv(args.csv, encoding="utf-8-sig")
    labels = frame.set_index("url")[args.label_col].to_dict()
    bundles = load_bundles(labels)
    counts = pd.Series([label for _u, label, _k in bundles]).value_counts().to_dict()
    print(f"캐시된 번들 {len(bundles)}건 {counts}\n")

    results = []
    for power in POWERS:
        scored = score_all(bundles, power, args.ontology_dir)
        normal_scores = [a for label, a, _s in scored if label == "normal"]
        washing_scores = [a for label, a, _s in scored if label == "washing"]
        print(
            f"  power={power:.3f} 채점 완료 "
            f"(normal 평균 {sum(normal_scores)/len(normal_scores):.1f}, "
            f"washing 평균 {sum(washing_scores)/len(washing_scores):.1f})",
            flush=True,
        )
        for normal_threshold in NORMAL_THRESHOLDS:
            for sufficiency_threshold in SUFFICIENCY_THRESHOLDS:
                row = metrics(scored, normal_threshold, sufficiency_threshold)
                row.update(
                    power=power,
                    normal_threshold=normal_threshold,
                    sufficiency_threshold=sufficiency_threshold,
                )
                results.append(row)

    table = pd.DataFrame(results).sort_values(
        ["mcc", "balanced_accuracy"], ascending=False
    )
    columns = [
        "power", "normal_threshold", "sufficiency_threshold",
        "mcc", "balanced_accuracy", "specificity", "washing_recall",
        "tp", "tn", "fp", "fn",
    ]
    print(f"\n=== 상위 {args.top}개 조합 (MCC 기준) ===")
    print(table[columns].head(args.top).to_string(index=False))

    best = table.iloc[0]
    print(
        f"\n최적: power={best.power}, ACCS 임계값={best.normal_threshold}, "
        f"sufficiency 임계값={best.sufficiency_threshold}"
        f"  ->  MCC {best.mcc:.3f}, 균형정확도 {best.balanced_accuracy:.3f}, "
        f"specificity {best.specificity:.3f}, washing 검출률 {best.washing_recall:.3f}"
    )

    if args.json_out:
        args.json_out.write_text(
            table[columns].head(50).to_json(orient="records", force_ascii=False, indent=2),
            encoding="utf-8",
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
