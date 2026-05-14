#!/usr/bin/env python3
"""Build a JupyterLite distribution that ships every use-case notebook.

Pipeline:

  1. Convert each ``data/use-cases/*.py`` to ``.ipynb`` via jupytext.
  2. Prepend a ``%pip install …`` setup cell so the notebooks can actually
     run in Pyodide (skrub/skore/ipywidgets/pyodide-http are not bundled).
  3. Run ``jupyter lite build`` with those notebooks as content into the
     requested output directory.

Cross-platform replacement for the original bash script. Driven by pixi
under the ``jupyterlite`` environment.

Usage
-----
  pixi run -e jupyterlite build-jupyterlite                 # → dist/jupyterlite/
  pixi run -e jupyterlite build-jupyterlite --output-dir X  # → X/
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


# ── Packages we piplite-install at notebook startup ───────────────────────────
PIPLITE_PACKAGES = ["skrub", "skore", "ipywidgets", "pyodide-http"]

SETUP_MD = (
    "## Setup\n"
    "\n"
    "This notebook runs in your browser via the Pyodide kernel. "
    "The cell below installs the scikit-learn ecosystem packages that aren't "
    "bundled with Pyodide by default and patches `urllib` so dataset loaders "
    "like `sklearn.datasets.fetch_*` work over browser fetch. "
    "Run it once before the rest of the notebook."
)
SETUP_CODE = (
    "%pip install -q " + " ".join(PIPLITE_PACKAGES) + "\n"
    "import pyodide_http; pyodide_http.patch_all()\n"
    "# api.openml.org 301-redirects without CORS headers; talk to www.openml.org directly\n"
    "import sklearn.datasets._openml as _openml\n"
    "_openml._OPENML_PREFIX = 'https://www.openml.org/'\n"
    "# skrub.TableReport.open() starts a local TCP server (not supported in Pyodide);\n"
    "# render the report inline via IPython.display instead.\n"
    "from skrub import TableReport\n"
    "from IPython.display import display, HTML\n"
    "TableReport.open = lambda self: display(HTML(self.html()))"
)


def _prepend_setup_cell(nb_path: Path) -> None:
    """Insert a markdown + code setup cell at the top of the notebook."""
    nb = json.loads(nb_path.read_text())
    md_cell = {"cell_type": "markdown", "metadata": {}, "source": SETUP_MD}
    code_cell = {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": SETUP_CODE,
    }
    nb["cells"] = [md_cell, code_cell] + nb["cells"]
    nb_path.write_text(json.dumps(nb, indent=1))


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
        _prepend_setup_cell(ipynb)
        out.append(ipynb)
    return out


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
