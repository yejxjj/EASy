#!/usr/bin/env python3
"""Export rule-engine audit features as JSONL for the future attention model."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, Iterable


def iter_json_objects(path: Path) -> Iterable[Dict[str, Any]]:
    if path.suffix.lower() == ".jsonl":
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                yield json.loads(line)
        return
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        yield from (item for item in data if isinstance(item, dict))
    elif isinstance(data, dict):
        yield data


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="analysis result JSON or JSONL")
    parser.add_argument("output", type=Path, help="output JSONL")
    args = parser.parse_args()

    written = 0
    with args.output.open("w", encoding="utf-8") as handle:
        for index, result in enumerate(iter_json_objects(args.input)):
            details = result.get("details") or {}
            features = details.get("attention_features")
            if not features:
                continue
            item = {
                "sample_id": result.get("sample_id") or result.get("url") or index,
                "label": result.get("label"),
                "rule_target": {
                    "accs": result.get("accs"),
                    "verdict": result.get("verdict"),
                    "confidence": result.get("conf"),
                },
                "features": features,
            }
            handle.write(json.dumps(item, ensure_ascii=False) + "\n")
            written += 1
    print(f"wrote {written} samples to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
