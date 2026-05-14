#!/usr/bin/env bash
# Build a JupyterLite distribution into ./jupyterlite/ and seed it with
# notebooks generated from data/use-cases/*.py (via jupytext).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

WORK="$(mktemp -d)"
NB_DIR="$WORK/files/use-cases"
mkdir -p "$NB_DIR"

shopt -s nullglob
for py in data/use-cases/*.py; do
  name="$(basename "$py" .py)"
  jupytext --to ipynb --output "$NB_DIR/$name.ipynb" "$py"
done

# Prepend a `%pip install skrub skore` setup cell so the notebooks can actually
# run in Pyodide (which doesn't bundle skrub/skore).
python scripts/add_setup_cell.py "$NB_DIR"

rm -rf jupyterlite
jupyter lite build \
  --contents "$WORK/files" \
  --output-dir jupyterlite
