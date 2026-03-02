#!/usr/bin/env python3
"""
Fetch live stats from GitHub and PyPI for every package in catalog.json.
Output → data/stats.json  (next to catalog.json, never touches individual package files)

Sources
-------
- GitHub REST API  → stars, forks, watchers, open issues, last commit, latest release
- pypistats.org    → downloads per day / week / month
- pypi.org JSON    → latest version, release date, requires-python, summary

Usage
-----
  python3 scripts/update_stats.py          # uses GITHUB_TOKEN env var if set
"""

import json
import os
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
DATA_DIR      = Path("data")
PACKAGES_DIR  = DATA_DIR / "packages"
CATALOG_PATH  = DATA_DIR / "catalog.json"
STATS_PATH    = DATA_DIR / "stats.json"

# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

def fetch_json(url, token=None, _retries=4, _backoff=5):
    """Fetch a URL and return parsed JSON, or None on any error.

    Automatically retries on HTTP 429 (Too Many Requests) with exponential
    backoff so the script stays robust against pypistats rate limits in CI.
    """
    headers = {"User-Agent": "scikit-learn-central/stats-bot"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    for attempt in range(1, _retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < _retries:
                wait = _backoff * attempt
                print(f"      ↺ 429 rate-limit, retrying in {wait}s (attempt {attempt}/{_retries}) …")
                time.sleep(wait)
            elif e.code == 404:
                return None   # not found — not an error worth logging noisily
            else:
                print(f"      ✗ HTTP {e.code}: {url}")
                return None
        except Exception as e:
            print(f"      ✗ {type(e).__name__}: {e}")
            return None
    print(f"      ✗ gave up after {_retries} attempts: {url}")
    return None


# ---------------------------------------------------------------------------
# GitHub
# ---------------------------------------------------------------------------

def _parse_github_slug(repo_url):
    """Return 'owner/repo' from a GitHub URL."""
    parts = repo_url.rstrip("/").split("/")
    return f"{parts[-2]}/{parts[-1]}"


def fetch_github_stats(repo_url, token=None):
    slug = _parse_github_slug(repo_url)
    base = f"https://api.github.com/repos/{slug}"

    # Main repo metadata
    repo = fetch_json(base, token=token)
    if not repo:
        return {}

    result = {
        "stars":       repo.get("stargazers_count"),
        "forks":       repo.get("forks_count"),
        "watchers":    repo.get("subscribers_count"),   # "watching" not "starred"
        "open_issues": repo.get("open_issues_count"),
        "last_commit": repo.get("pushed_at"),           # ISO 8601
    }

    # Latest release (tag name + date)
    release = fetch_json(f"{base}/releases/latest", token=token)
    if release and "tag_name" in release:
        result["latest_release"]      = release.get("tag_name")
        result["latest_release_date"] = release.get("published_at")

    time.sleep(0.25)   # stay well inside rate limits

    # Drop None values
    return {k: v for k, v in result.items() if v is not None}


# ---------------------------------------------------------------------------
# PyPI
# ---------------------------------------------------------------------------

def fetch_pypi_stats(pkg_id):
    result = {}

    # ── pypistats: downloads per day / week / month ──────────────────────
    recent = fetch_json(f"https://pypistats.org/api/packages/{pkg_id}/recent")
    if recent and "data" in recent:
        d = recent["data"]
        result["downloads"] = {
            "last_day":   d.get("last_day"),
            "last_week":  d.get("last_week"),
            "last_month": d.get("last_month"),
        }

    # ── pypi.org JSON API: version, release date, python requirement ──────
    meta = fetch_json(f"https://pypi.org/pypi/{pkg_id}/json")
    if meta and "info" in meta:
        info = meta["info"]
        version = info.get("version")
        result["version"]          = version
        result["requires_python"]  = info.get("requires_python")
        result["summary"]          = info.get("summary")

        # Upload date of the latest release files
        releases = meta.get("releases", {})
        if version and releases.get(version):
            files = releases[version]
            if files:
                result["release_date"] = files[0].get("upload_time")

    time.sleep(2)    # pypistats rate-limits aggressively; 2 s keeps us safe

    return {k: v for k, v in result.items() if v is not None}


# ---------------------------------------------------------------------------
# Per-package orchestration
# ---------------------------------------------------------------------------

def collect_stats(pkg_data, token=None):
    """Collect all stats for one package dict and return a stats sub-dict."""
    pkg_id   = pkg_data["id"]
    repo_url = pkg_data.get("repository", "")
    stats    = {}

    if "github.com" in repo_url:
        print(f"      GitHub …")
        gh = fetch_github_stats(repo_url, token=token)
        if gh:
            stats["github"] = gh

    print(f"      PyPI   …")
    py = fetch_pypi_stats(pkg_id)
    if py:
        stats["pypi"] = py

    return stats


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("⚠  No GITHUB_TOKEN found — GitHub API limited to 60 req/hour\n")

    catalog = json.loads(CATALOG_PATH.read_text())

    stats_out = {
        "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "packages":   {},
    }

    # ── Core (scikit-learn lives directly in catalog.json) ────────────────
    core = catalog["core"]
    print(f"[core] {core['id']}")
    stats_out["packages"][core["id"]] = collect_stats(core, token=token)

    # ── Ecosystem packages ─────────────────────────────────────────────────
    for pkg_id in catalog["packages"]:
        pkg_path = PACKAGES_DIR / f"{pkg_id}.json"
        if not pkg_path.exists():
            print(f"\n[skip] {pkg_id}  ← no JSON file in data/packages/")
            continue

        print(f"\n[pkg]  {pkg_id}")
        pkg_data = json.loads(pkg_path.read_text())
        stats_out["packages"][pkg_id] = collect_stats(pkg_data, token=token)

    # ── Write output ───────────────────────────────────────────────────────
    STATS_PATH.write_text(json.dumps(stats_out, indent=2) + "\n")
    n = len(stats_out["packages"])
    print(f"\n✓  {STATS_PATH} written — {n} packages, updated_at {stats_out['updated_at']}")


if __name__ == "__main__":
    main()
