#!/usr/bin/env python3
"""Validate Fides ontology CSV files before running the engine."""
from __future__ import annotations

import argparse
import csv
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, List, Set, Tuple

import pandas as pd

REQUIRED_FILES = {
    "capabilities": "ai_capability_master.csv",
    "requirements": "capability_requirement_master.csv",
    "confusion": "confusion_rule_master.csv",
    "patterns": "evidence_pattern_master.csv",
    "requirement_maps": "requirement_evidence_map_master.csv",
    "sources": "source_credibility_master.csv",
    "negative": "negative_pattern_master.csv",
    "scoring": "capability_scoring_rule_master.csv",
}

REQUIRED_COLUMNS = {
    "ai_capability_master.csv": {"capability_id", "capability_name_ko"},
    "capability_requirement_master.csv": {
        "capability_id", "component_type", "component_name_ko", "required_level"
    },
    "evidence_pattern_master.csv": {
        "capability_id", "pattern_text_ko", "evidence_strength"
    },
    "requirement_evidence_map_master.csv": {
        "capability_id", "component_name_ko", "acceptable_evidence_source",
        "evidence_match_type", "minimum_strength", "match_scope", "base_weight"
    },
    "source_credibility_master.csv": {
        "source_type", "credibility_weight", "directness_base_weight",
        "update_reliability_weight"
    },
    "negative_pattern_master.csv": {
        "applies_to_capability_id", "pattern_text_ko", "penalty_weight"
    },
    "capability_scoring_rule_master.csv": {
        "capability_id", "required_threshold_for_positive"
    },
}


def read_csv_strict(path: Path) -> Tuple[pd.DataFrame, List[str]]:
    errors: List[str] = []
    try:
        frame = pd.read_csv(path, encoding="utf-8-sig")
    except pd.errors.ParserError as exc:
        errors.append(f"CSV column error: {exc}")
        frame = pd.read_csv(
            path, encoding="utf-8-sig", engine="python", on_bad_lines="skip"
        )
    frame.columns = [str(col).replace("\ufeff", "").strip() for col in frame.columns]
    return frame.fillna(""), errors


def norm(value: object) -> str:
    return str(value or "").strip().lower()


def as_float(value: object, default: float = -1.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ontology_dir", type=Path)
    args = parser.parse_args()
    root = args.ontology_dir.expanduser().resolve()

    errors: List[str] = []
    warnings: List[str] = []
    frames: Dict[str, pd.DataFrame] = {}

    for filename in REQUIRED_FILES.values():
        path = root / filename
        if not path.exists():
            errors.append(f"missing file: {filename}")
            continue
        frame, parse_errors = read_csv_strict(path)
        frames[filename] = frame
        errors.extend(f"{filename}: {item}" for item in parse_errors)
        required = REQUIRED_COLUMNS.get(filename, set())
        missing = sorted(required - set(frame.columns))
        if missing:
            errors.append(f"{filename}: missing columns: {', '.join(missing)}")

    if errors and not frames:
        for item in errors:
            print(f"ERROR: {item}")
        return 1

    cap_frame = frames.get("ai_capability_master.csv", pd.DataFrame())
    capability_ids: Set[str] = set(cap_frame.get("capability_id", pd.Series(dtype=str)).astype(str))
    capability_ids.discard("")
    duplicate_caps = [key for key, count in Counter(cap_frame.get("capability_id", [])).items() if key and count > 1]
    if duplicate_caps:
        errors.append(f"duplicate capability_id: {', '.join(map(str, duplicate_caps))}")

    references = [
        ("capability_requirement_master.csv", "capability_id"),
        ("evidence_pattern_master.csv", "capability_id"),
        ("requirement_evidence_map_master.csv", "capability_id"),
        ("capability_scoring_rule_master.csv", "capability_id"),
        ("negative_pattern_master.csv", "applies_to_capability_id"),
    ]
    for filename, column in references:
        frame = frames.get(filename)
        if frame is None or column not in frame:
            continue
        unknown = sorted({str(value) for value in frame[column] if str(value) and str(value) not in capability_ids})
        if unknown:
            errors.append(f"{filename}: unknown capability IDs in {column}: {', '.join(unknown)}")

    req = frames.get("capability_requirement_master.csv", pd.DataFrame())
    maps = frames.get("requirement_evidence_map_master.csv", pd.DataFrame())
    source_frame = frames.get("source_credibility_master.csv", pd.DataFrame())
    source_types = {norm(value) for value in source_frame.get("source_type", []) if norm(value)}

    if not req.empty and not maps.empty:
        map_keys = {
            (str(row.get("capability_id", "")).strip(), str(row.get("component_name_ko", "")).strip())
            for _, row in maps.iterrows()
        }
        for _, row in req.iterrows():
            key = (str(row.get("capability_id", "")).strip(), str(row.get("component_name_ko", "")).strip())
            if key not in map_keys:
                errors.append(f"no evidence map for requirement: {key[0]} / {key[1]}")

    if not maps.empty:
        duplicate_keys = Counter(
            (
                str(row.get("capability_id", "")).strip(),
                str(row.get("component_name_ko", "")).strip(),
                norm(row.get("acceptable_evidence_source", "")),
                norm(row.get("evidence_match_type", "")),
                norm(row.get("match_scope", "")),
            )
            for _, row in maps.iterrows()
        )
        for key, count in duplicate_keys.items():
            if count > 1:
                warnings.append(f"duplicate requirement map x{count}: {' / '.join(key)}")

        for index, row in maps.iterrows():
            source = norm(row.get("acceptable_evidence_source", ""))
            if source and source not in source_types:
                errors.append(f"requirement map row {index + 2}: source '{source}' absent from source credibility table")
            weight = as_float(row.get("base_weight"))
            if not 0.0 <= weight <= 1.0:
                errors.append(f"requirement map row {index + 2}: base_weight must be 0..1, got {row.get('base_weight')!r}")
            level = norm(row.get("required_level", ""))
            if level and level not in {"required", "optional", "필수", "선택", "mandatory"}:
                warnings.append(f"requirement map row {index + 2}: unusual required_level={level!r}")

    for _, row in source_frame.iterrows():
        source = norm(row.get("source_type", ""))
        for column in ("credibility_weight", "directness_base_weight", "update_reliability_weight"):
            value = as_float(row.get(column))
            if not 0.0 <= value <= 1.0:
                errors.append(f"source {source}: {column} must be 0..1, got {row.get(column)!r}")

    patterns = frames.get("evidence_pattern_master.csv", pd.DataFrame())
    if not patterns.empty:
        for cap_id in capability_ids:
            count = int((patterns.get("capability_id", "") == cap_id).sum())
            if count == 0:
                warnings.append(f"capability has no positive pattern: {cap_id}")

    print(f"Ontology: {root}")
    print(f"Capabilities: {len(capability_ids)}")
    print(f"Errors: {len(errors)}, warnings: {len(warnings)}")
    for item in errors:
        print(f"ERROR: {item}")
    for item in warnings:
        print(f"WARNING: {item}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
