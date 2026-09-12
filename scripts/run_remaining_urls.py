#!/usr/bin/env python3
"""근거 캐시가 없는 URL만 골라 파이프라인을 돌린다.

이미 분석한 제품은 dataset/evidence_cache/*.json 에 남아 있으므로 건너뛴다.
한 건이 실패해도 다음 건으로 넘어가고, 진행 상황을 계속 출력한다.

Usage:
    python scripts/run_remaining_urls.py                 # 남은 전부
    python scripts/run_remaining_urls.py --limit 10      # 앞 10건만
"""
from __future__ import annotations

import argparse
import glob
import json
import sys
import time
from pathlib import Path

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

LABEL_SOURCES = (
    "benchmark_dataset_labeled.csv",
    "benchmark_holdout_209.csv",
    "benchmark_dataset_last.csv",
    "benchmark_dataset.csv",
)


def collect_urls() -> dict:
    """라벨 CSV 여러 개에서 url -> label 을 모은다. 라벨이 있는 값을 우선한다."""
    urls = {}
    for name in LABEL_SOURCES:
        path = REPO_ROOT / "dataset" / name
        if not path.exists():
            continue
        frame = pd.read_csv(path, encoding="utf-8-sig")
        if "url" not in frame.columns:
            continue
        labels = frame["label"] if "label" in frame.columns else [None] * len(frame)
        for url, label in zip(frame["url"], labels):
            url = str(url).strip()
            if not url or url == "nan":
                continue
            label = "" if pd.isna(label) else str(label).strip()
            if url not in urls or (label and not urls[url]):
                urls[url] = label
    return urls


def already_done() -> set:
    done = set()
    for path in glob.glob(str(REPO_ROOT / "dataset" / "evidence_cache" / "*.json")):
        try:
            done.add(json.loads(Path(path).read_text(encoding="utf-8"))["url"])
        except (OSError, ValueError, KeyError):
            continue
    return done


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=0, help="처리할 최대 건수(0=전부)")
    args = parser.parse_args()

    from pipeline_main import run_full_pipeline  # noqa: E402  (경로 설정 후 import)

    urls = collect_urls()
    done = already_done()
    todo = [(u, l) for u, l in urls.items() if u not in done]
    if args.limit:
        todo = todo[: args.limit]

    print(f"전체 {len(urls)}건 · 이미 분석 {len(urls) - len([u for u in urls if u not in done])}건")
    print(f"이번에 돌릴 것: {len(todo)}건\n")

    ok = failed = 0
    started = time.time()
    for index, (url, label) in enumerate(todo, 1):
        elapsed = time.time() - started
        rate = elapsed / max(index - 1, 1)
        eta = rate * (len(todo) - index + 1) / 60 if index > 1 else 0
        print(f"\n{'=' * 80}")
        print(f"[{index}/{len(todo)}] label={label or '(없음)'} | 경과 {elapsed / 60:.1f}분"
              + (f" | 남은 예상 {eta:.0f}분" if eta else ""))
        print(url)
        print("=" * 80)
        try:
            run_full_pipeline(url)
            ok += 1
        except Exception as exc:  # 한 건 실패가 배치를 멈추지 않게 한다
            failed += 1
            print(f"[실패] {type(exc).__name__}: {str(exc)[:200]}")

    print(f"\n{'=' * 80}")
    print(f"완료: 성공 {ok}건 · 실패 {failed}건 · 총 {(time.time() - started) / 60:.1f}분")
    print("이제 scripts/score_all_to_excel.py 로 전수 재채점하면 된다.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
