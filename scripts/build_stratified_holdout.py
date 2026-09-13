#!/usr/bin/env python3
"""정상/워싱 라벨 비율을 유지한 홀드아웃을 새로 만든다.

기존 dataset/benchmark_holdout_209.csv 는 라벨 371건 중 209건을 뗐는데
그 209건이 전부 genuine 이었다 -- 워싱 30건이 전부 튜닝셋에 남아서,
재보정한 임계값의 "워싱을 놓치는 비율"은 한 번도 검증되지 못했다.

이 스크립트는 genuine/washing(=suspicious 포함) 각각에서 지정한 비율만큼
계층 샘플링으로 떼어 홀드아웃을 만든다. seed 고정으로 재현 가능하다.

Usage:
    python scripts/build_stratified_holdout.py --holdout-frac 0.3
"""
from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parent.parent


def normalize_label(value: str) -> str:
    text = str(value or "").strip().lower()
    if text in {"genuine", "normal", "정상", "credible"}:
        return "normal"
    if text in {"washing", "워싱", "ai_washing", "suspicious", "의심", "suspected"}:
        return "washing"
    return text


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv", nargs="?", default=str(REPO_ROOT / "dataset" / "benchmark_dataset_labeled.csv"))
    parser.add_argument("--label-col", default="label")
    parser.add_argument("--holdout-frac", type=float, default=0.3,
                         help="각 클래스에서 홀드아웃으로 뗄 비율 (기본 0.3)")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--holdout-out", default=str(REPO_ROOT / "dataset" / "benchmark_holdout_stratified.csv"))
    parser.add_argument("--tuning-out", default=str(REPO_ROOT / "dataset" / "benchmark_tuning_stratified.csv"))
    args = parser.parse_args()

    frame = pd.read_csv(args.csv, encoding="utf-8-sig")
    frame["_norm_label"] = frame[args.label_col].map(normalize_label)
    frame = frame[frame["_norm_label"].isin({"normal", "washing"})]

    holdout_parts, tuning_parts = [], []
    for label, group in frame.groupby("_norm_label"):
        group = group.sample(frac=1.0, random_state=args.seed)  # shuffle
        n_holdout = round(len(group) * args.holdout_frac)
        holdout_parts.append(group.iloc[:n_holdout])
        tuning_parts.append(group.iloc[n_holdout:])

    holdout = pd.concat(holdout_parts).drop(columns=["_norm_label"]).sample(frac=1.0, random_state=args.seed)
    tuning = pd.concat(tuning_parts).drop(columns=["_norm_label"]).sample(frac=1.0, random_state=args.seed)

    holdout.to_csv(args.holdout_out, index=False, encoding="utf-8-sig")
    tuning.to_csv(args.tuning_out, index=False, encoding="utf-8-sig")

    def counts(df):
        return df[args.label_col].map(normalize_label).value_counts().to_dict()

    print(f"홀드아웃 {len(holdout)}건 -> {args.holdout_out}")
    print(f"  {counts(holdout)}")
    print(f"튜닝셋 {len(tuning)}건 -> {args.tuning_out}")
    print(f"  {counts(tuning)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
