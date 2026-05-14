#!/usr/bin/env python3
"""Symlink (or unlink) `public/jupyterlite` → `dist/jupyterlite`.

Used during `pixi run dev` so the Vite dev server can serve the JupyterLite
build at `/jupyterlite/...` — without it, the "Open in JupyterLite" button
404s because Vite only sees files under `public/` and `src/`.

Designed to be cheap (~50 ms) and idempotent so it can run on every `dev`.

Usage
-----
  python scripts/link_jupyterlite.py              # create the symlink
  python scripts/link_jupyterlite.py --remove     # remove it (run before
                                                  # `vite build` so the
                                                  # symlink isn't copied
                                                  # into dist/)
"""
from __future__ import annotations

import argparse
import os
import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
LINK_PATH = REPO_ROOT / "public" / "jupyterlite"
TARGET = REPO_ROOT / "dist" / "jupyterlite"


def remove_existing(path: Path) -> None:
    """Remove `path` whether it's a symlink, a directory, or a regular file."""
    if path.is_symlink() or path.exists():
        if path.is_symlink() or path.is_file():
            path.unlink()
        else:
            shutil.rmtree(path)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--remove",
        action="store_true",
        help="Remove the symlink instead of creating it.",
    )
    args = parser.parse_args()

    if args.remove:
        if LINK_PATH.is_symlink() or LINK_PATH.exists():
            remove_existing(LINK_PATH)
            print(f"✓ removed {LINK_PATH.relative_to(REPO_ROOT)}")
        return 0

    if not TARGET.exists():
        # Don't fail dev — just warn. The user can run the JupyterLite build
        # whenever they want to test the link; meanwhile Vue dev still works.
        print(
            f"ℹ {TARGET.relative_to(REPO_ROOT)} not built yet — "
            "run `pixi run -e jupyterlite build-jupyterlite` (or `pixi run build`) "
            "to enable the Open-in-JupyterLite link in dev.",
            file=sys.stderr,
        )
        return 0

    remove_existing(LINK_PATH)
    # Relative target so the symlink survives moving the repo around.
    rel_target = os.path.relpath(TARGET, LINK_PATH.parent)
    try:
        os.symlink(rel_target, LINK_PATH, target_is_directory=True)
    except OSError as e:
        # Windows without developer mode rejects symlinks — fall back to a
        # copy so dev still works (rebuild on demand).
        print(f"ℹ symlink failed ({e}); copying tree instead", file=sys.stderr)
        shutil.copytree(TARGET, LINK_PATH)

    print(f"✓ {LINK_PATH.relative_to(REPO_ROOT)} → {rel_target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
