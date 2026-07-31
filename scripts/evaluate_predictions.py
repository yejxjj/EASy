#!/usr/bin/env python3
"""Evaluate Fides predictions and audit model-family leakage without sklearn."""
from __future__ import annotations

import argparse
import json
import math
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, Iterable, List, Sequence, Tuple

import pandas as pd


def normalize_label(value: object) -> str:
    text = str(value or "").strip().lower()
    mapping = {
        "genuine": "normal", "normal": "normal", "정상": "normal", "credible": "normal",
        "washing": "washing", "워싱": "washing", "ai_washing": "washing",
        "suspicious": "washing", "의심": "washing", "suspected": "washing",
    }
    return mapping.get(text, text)


def prediction_from_score(score: float, threshold: float) -> str:
    return "normal" if score >= threshold else "washing"


def safe_div(a: float, b: float) -> float:
    return a / b if b else 0.0


def binary_metrics(y_true: Sequence[str], y_pred: Sequence[str]) -> Dict[str, float]:
    tp = sum(t == "washing" and p == "washing" for t, p in zip(y_true, y_pred))
    tn = sum(t == "normal" and p == "normal" for t, p in zip(y_true, y_pred))
    fp = sum(t == "normal" and p == "washing" for t, p in zip(y_true, y_pred))
    fn = sum(t == "washing" and p == "normal" for t, p in zip(y_true, y_pred))
    precision = safe_div(tp, tp + fp)
    recall = safe_div(tp, tp + fn)
    specificity = safe_div(tn, tn + fp)
    f1 = safe_div(2 * precision * recall, precision + recall)
    accuracy = safe_div(tp + tn, len(y_true))
    balanced_accuracy = (recall + specificity) / 2.0
    denominator = math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn))
    mcc = safe_div(tp * tn - fp * fn, denominator)
    return {
        "n": len(y_true), "tp": tp, "tn": tn, "fp": fp, "fn": fn,
        "accuracy": accuracy, "balanced_accuracy": balanced_accuracy,
        "washing_precision": precision, "washing_recall": recall,
        "washing_f1": f1, "specificity": specificity, "mcc": mcc,
    }


def normalize_model(value: object) -> str:
    text = str(value or "").lower()
    text = re.sub(r"\b(?:ssd|hdd|ram|메모리|저장용량)\s*\d+\s*(?:tb|gb)\b", " ", text)
    text = re.sub(r"\b\d+\s*(?:tb|gb)\b", " ", text)
    text = re.sub(r"[^0-9a-z가-힣]+", "", text)
    return text


def leakage_report(frame: pd.DataFrame, split_col: str, group_cols: Sequence[str]) -> List[Dict[str, object]]:
    if split_col not in frame:
        return []
    groups: Dict[str, set] = defaultdict(set)
    rows: Dict[str, List[int]] = defaultdict(list)
    for idx, row in frame.iterrows():
        key = "|".join(normalize_model(row.get(column, "")) for column in group_cols)
        if not key.strip("|"):
            continue
        groups[key].add(str(row.get(split_col, "")))
        rows[key].append(int(idx))
    leaks = []
    for key, splits in groups.items():
        if len(splits) > 1:
            leaks.append({"group": key, "splits": sorted(splits), "rows": rows[key][:20]})
    return sorted(leaks, key=lambda item: (-len(item["splits"]), item["group"]))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv", type=Path)
    parser.add_argument("--label-col", default="label")
    parser.add_argument("--prediction-col", default="predicted_label")
    parser.add_argument("--score-col", default="accs")
    parser.add_argument("--threshold", type=float, default=60.0)
    parser.add_argument("--split-col", default="split")
    parser.add_argument("--group-cols", nargs="+", default=["brand", "model_name"])
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    frame = pd.read_csv(args.csv, encoding="utf-8-sig").fillna("")
    if args.label_col not in frame:
        parser.error(f"label column missing: {args.label_col}")

    y_true = [normalize_label(value) for value in frame[args.label_col]]
    if args.prediction_col in frame:
        y_pred = [normalize_label(value) for value in frame[args.prediction_col]]
    elif args.score_col in frame:
        y_pred = [prediction_from_score(float(value), args.threshold) for value in frame[args.score_col]]
    else:
        parser.error(f"need {args.prediction_col!r} or {args.score_col!r}")

    valid = [(t, p) for t, p in zip(y_true, y_pred) if t in {"normal", "washing"} and p in {"normal", "washing"}]
    y_true = [item[0] for item in valid]
    y_pred = [item[1] for item in valid]
    metrics = binary_metrics(y_true, y_pred)
    class_counts = Counter(y_true)
    leaks = leakage_report(frame, args.split_col, args.group_cols)

    report = {
        "threshold": args.threshold,
        "class_counts": dict(class_counts),
        "metrics": metrics,
        "group_leak_count": len(leaks),
        "group_leak_examples": leaks[:20],
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if args.json_out:
        args.json_out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
