#!/usr/bin/env python3
"""Build a JupyterLite distribution that ships every use-case notebook.

Pipeline:

  1. Convert each ``data/use-cases/*.py`` to ``.ipynb`` via jupytext.
  2. Mirror ``data/use-cases/datasets/`` next to the notebooks so relative
     reads like ``pd.read_csv("datasets/foo.csv")`` resolve in Pyodide.
  3. Run ``jupyter lite build`` with those notebooks as content into the
     requested output directory.

Notebooks are emitted as-is from the ``.py`` source. Any per-notebook setup
(``%pip install``, kernel patches, etc.) should be authored directly in the
``.py`` file using jupytext cell markers — this script no longer injects a
synthetic setup cell.

Cross-platform replacement for the original bash script. Driven by pixi
under the ``jupyterlite`` environment.

Usage
-----
  pixi run -e jupyterlite build-jupyterlite                 # → dist/jupyterlite/
  pixi run -e jupyterlite build-jupyterlite --output-dir X  # → X/
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def _convert_use_cases(src_dir: Path, dest_dir: Path) -> list[Path]:
    """jupytext-convert every .py in src_dir to .ipynb in dest_dir."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    out: list[Path] = []
    for py in sorted(src_dir.glob("*.py")):
        ipynb = dest_dir / f"{py.stem}.ipynb"
        print(f"  • {py.name} → {ipynb.relative_to(dest_dir.parent)}")
        subprocess.run(
            ["jupytext", "--to", "ipynb", "--output", str(ipynb), str(py)],
            check=True,
        )
        out.append(ipynb)
    return out


def _copy_datasets(src_dir: Path, dest_dir: Path) -> int:
    """Mirror data/use-cases/datasets/ next to the generated notebooks so
    relative paths like 'datasets/california_housing.csv' resolve in
    JupyterLite. Returns the number of files copied (0 if no datasets/)."""
    src_datasets = src_dir / "datasets"
    if not src_datasets.is_dir():
        return 0
    dest_datasets = dest_dir / "datasets"
    dest_datasets.mkdir(parents=True, exist_ok=True)
    n = 0
    for f in sorted(src_datasets.iterdir()):
        if f.is_file():
            shutil.copy2(f, dest_datasets / f.name)
            print(f"  • datasets/{f.name}")
            n += 1
    return n


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--use-cases",
        type=Path,
        default=Path("data/use-cases"),
        help="Directory of .py use-case sources (default: data/use-cases)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("dist/jupyterlite"),
        help="Where to write the built JupyterLite site (default: dist/jupyterlite)",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    src_dir = (repo_root / args.use_cases).resolve()
    out_dir = (repo_root / args.output_dir).resolve()

    if not src_dir.is_dir():
        print(f"✗ Source directory not found: {src_dir}", file=sys.stderr)
        return 1

    print(f"→ Converting use-cases from {src_dir.relative_to(repo_root)}")
    with tempfile.TemporaryDirectory() as tmp:
        contents_root = Path(tmp) / "files"
        notebooks_dir = contents_root / "use-cases"
        notebooks = _convert_use_cases(src_dir, notebooks_dir)
        print(f"  ✓ converted {len(notebooks)} notebook(s)")

        n_datasets = _copy_datasets(src_dir, notebooks_dir)
        if n_datasets:
            print(f"  ✓ embedded {n_datasets} dataset file(s)")

        if out_dir.exists():
            shutil.rmtree(out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        print(f"→ Building JupyterLite into {out_dir.relative_to(repo_root)}")
        subprocess.run(
            [
                "jupyter", "lite", "build",
                "--contents", str(contents_root),
                "--output-dir", str(out_dir),
            ],
            check=True,
        )

    print(f"✓ JupyterLite ready at {out_dir.relative_to(repo_root)}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
