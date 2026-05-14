"""Inject a piplite install cell at the top of each .ipynb in a directory.

Pyodide bundles numpy/pandas/scikit-learn/matplotlib; skrub and skore are not
bundled, so notebooks that import them need a one-time piplite install before
the rest of the cells will run. We unconditionally prepend the install cell —
running `%pip install` for an already-resolved package is a fast no-op.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

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


def patch(nb_path: Path) -> None:
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


def main(argv: list[str]) -> int:
    if not argv:
        print("usage: add_setup_cell.py <dir-with-ipynb> [...]", file=sys.stderr)
        return 2
    for raw in argv:
        for nb in sorted(Path(raw).glob("*.ipynb")):
            patch(nb)
            print(f"patched {nb}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
