#!/usr/bin/env python3
"""One-off migration: replace `nature` + `scope` with `categories`.

Source of truth is the taxonomy proposed in
https://github.com/probabl-ai/scikit-learn-central/issues/16#issuecomment-4459402880

Idempotent: re-running on already-migrated files is a no-op (the script
only adds the `categories` field if missing and strips legacy keys).

Usage
-----
  python scripts/migrate_categories.py            # apply
  python scripts/migrate_categories.py --check    # exit 1 if anything is missing / wrong
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
PACKAGES_DIR = REPO_ROOT / "data" / "packages"

VALID_CATEGORIES = {
    "components",
    "domain-toolkit",
    "assembly-utility",
    "evaluation",
    "explainability",
    "fairness",
    "hpo-automl",
    "mlops",
    "hpc",
}

# Mapping from the issue comment. Multi-category packages list every
# applicable bucket (the ⇅ marker in the source comment).
CATEGORIES: dict[str, list[str]] = {
    # T1 · Components
    "skrub":             ["components"],
    "feature-engine":    ["components"],
    "category-encoders": ["components"],
    "umap-learn":        ["components"],
    "prince":            ["components"],
    "pyod":              ["components"],
    "xgboost":           ["components"],
    "lightgbm":          ["components"],
    "catboost":          ["components"],
    "glum":              ["components"],
    "skglm":             ["components"],
    "tabicl":            ["components"],
    "skorch":            ["components"],
    # T1 · Components + (other tier)
    "imbalanced-learn":  ["components", "assembly-utility"],
    "interpret":         ["components", "explainability"],
    "cuml":              ["components", "hpc"],
    "auto-sklearn":      ["components", "hpo-automl"],

    # T1 · Domain Toolkit
    "sktime":            ["domain-toolkit"],
    "tslearn":           ["domain-toolkit"],
    "aeon":              ["domain-toolkit"],
    "scikit-survival":   ["domain-toolkit"],
    "hazardous":         ["domain-toolkit"],
    "scikit-multilearn": ["domain-toolkit"],
    "river":             ["domain-toolkit"],
    "bertopic":          ["domain-toolkit"],
    "skforecast":        ["domain-toolkit", "assembly-utility"],

    # T1 · Assembly Utility (singles)
    "mlxtend":           ["assembly-utility"],

    # T2 · Evaluation
    "skore":             ["evaluation"],
    "model-diagnostics": ["evaluation"],

    # T2 · Explainability
    "shap":              ["explainability"],
    "lightshap":         ["explainability"],
    "eli5":              ["explainability"],
    "hidimstat":         ["explainability"],

    # T2 · Fairness (both span Assembly Utility)
    "fairlearn":         ["fairness", "assembly-utility"],
    "scikit-lego":       ["fairness", "assembly-utility"],

    # T2 · HPO / AutoML
    "optuna":            ["hpo-automl"],

    # T3 · Infrastructure (MLOps + High-Performance Computing)
    "mlflow":            ["mlops"],
    "skops":             ["mlops"],
    # cuml is also listed above as components+hpc
}

# Legacy fields to remove on write.
LEGACY_KEYS = ("nature", "scope")


def migrate(path: Path, *, check: bool) -> bool:
    """Return True if the file is already in the target state, False otherwise."""
    pkg = json.loads(path.read_text())
    pkg_id = pkg["id"]
    if pkg_id not in CATEGORIES:
        print(f"  ✗ {pkg_id}: no mapping in CATEGORIES (skipped)")
        return False

    desired = CATEGORIES[pkg_id]
    invalid = [c for c in desired if c not in VALID_CATEGORIES]
    if invalid:
        print(f"  ✗ {pkg_id}: invalid categories in mapping: {invalid}")
        return False

    needs_categories = pkg.get("categories") != desired
    has_legacy = any(k in pkg for k in LEGACY_KEYS)
    if not needs_categories and not has_legacy:
        return True

    if check:
        if needs_categories:
            print(f"  ✗ {pkg_id}: categories outdated (have {pkg.get('categories')}, want {desired})")
        if has_legacy:
            present = [k for k in LEGACY_KEYS if k in pkg]
            print(f"  ✗ {pkg_id}: legacy fields still present: {present}")
        return False

    # Rebuild dict, preserving insertion order: drop legacy keys, place
    # `categories` where `scope` used to live (or right after `docs`).
    out: dict = {}
    for k, v in pkg.items():
        if k in LEGACY_KEYS:
            if "categories" not in out:
                out["categories"] = desired
            continue
        out[k] = v
    if "categories" not in out:
        # No legacy keys to replace — insert near the start (after `docs`
        # if present, otherwise at end).
        out = {}
        inserted = False
        for k, v in pkg.items():
            out[k] = v
            if k == "docs" and not inserted:
                out["categories"] = desired
                inserted = True
        if not inserted:
            out["categories"] = desired

    path.write_text(json.dumps(out, indent=2) + "\n")
    print(f"  ✓ {pkg_id}: categories = {desired}")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Don't write — exit 1 if anything is missing or wrong.",
    )
    args = parser.parse_args()

    paths = sorted(PACKAGES_DIR.glob("*.json"))
    print(f"→ scanning {len(paths)} package files")
    bad = 0
    for p in paths:
        if not migrate(p, check=args.check):
            bad += 1

    if bad:
        msg = "still drifting" if args.check else "could not migrate"
        print(f"\n✗ {bad} package(s) {msg}")
        return 1
    print(f"\n✓ all {len(paths)} packages aligned with the new taxonomy")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
