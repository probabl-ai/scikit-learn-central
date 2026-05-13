# scikit-learn-central
 Scikit-learn Central — an interactive ecosystem explorer for the scikit-learn universe. Browse tens of compatible packages by nature, scope & license; discover real-world ML use cases tagged by industry & technique; see sample code instantly. Built with the :probabl. design system.

## JupyterLite integration

Each use case card has an **Open in JupyterLite** action that launches a fully interactive JupyterLab tab with the use case's notebook pre-opened. The kernel is Pyodide (Python + scikit-learn in WebAssembly), so it runs entirely client-side.

CI builds the JupyterLite distribution on every deploy: `.py` files under `data/use-cases/` are converted to `.ipynb` via [jupytext](https://jupytext.readthedocs.io/), then `jupyter lite build` writes the static site into `jupyterlite/` (gitignored, served at `/jupyterlite/` by GitHub Pages).

To preview locally:

```bash
pip install -r requirements-dev.txt
bash scripts/build-jupyterlite.sh
python -m http.server 8000
# open http://localhost:8000/
```

Pyodide ships `numpy`, `pandas`, `scikit-learn`, and `matplotlib`. `skrub` and `skore` aren't bundled, so `scripts/add_setup_cell.py` prepends a `%pip install -q skrub skore` cell to every generated notebook — piplite resolves the wheels from PyPI on first run.
