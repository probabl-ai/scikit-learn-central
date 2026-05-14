#!/usr/bin/env python3
"""Download every dataset used by a use-case notebook and commit it to
`data/use-cases/datasets/` as CSV.

Embedding the data lets the JupyterLite build ship it alongside the notebooks
so they run entirely offline — no `pyodide-http` patches, no OpenML round-trip
from the browser. The .py files just `pd.read_csv("datasets/<name>.csv")`.

Re-run this whenever a use case is added or its dataset upstream changes:

    pixi run -e datasets fetch-datasets
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd
from sklearn.datasets import fetch_california_housing, fetch_openml


REPO_ROOT = Path(__file__).resolve().parent.parent
DEST = REPO_ROOT / "data" / "use-cases" / "datasets"


def fetch_california_housing_csv() -> None:
    out = DEST / "california_housing.csv"
    print(f"  → california housing  → {out.relative_to(REPO_ROOT)}")
    bunch = fetch_california_housing(as_frame=True)
    # `frame` already includes features + the `MedHouseVal` target column.
    bunch.frame.to_csv(out, index=False)


def fetch_german_credit_csv() -> None:
    """German Credit (UCI, OpenML data_id=31) — only the 5 features the
    fraud-detection use case touches, plus the target."""
    out = DEST / "german_credit.csv"
    print(f"  → german credit       → {out.relative_to(REPO_ROOT)}")
    credit = fetch_openml(data_id=31, as_frame=True, parser="pandas")
    keep = [
        "checking_status",
        "credit_amount",
        "duration",
        "personal_status",
        "other_payment_plans",
    ]
    df = credit.data[keep].assign(target=credit.target)
    df.to_csv(out, index=False)


def main() -> int:
    DEST.mkdir(parents=True, exist_ok=True)
    print(f"→ writing datasets to {DEST.relative_to(REPO_ROOT)}/")
    fetch_california_housing_csv()
    fetch_german_credit_csv()
    print("✓ done")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
