#!/usr/bin/env python3
"""
Fetch GitHub reaction counts (👍) for release highlights that have a github_issue_url.
Updates reaction_count in-place in data/releases/scikit-learn.json.

The script supports both issues and pull requests from any public GitHub repository
(useful for SLEPs which live in scikit-learn/enhancement_proposals).

Usage:
  python3 scripts/update_release_reactions.py          # uses GITHUB_TOKEN env var if set

Environment variables:
  GITHUB_TOKEN   Optional GitHub personal access token (increases rate limit to 5000/hr)
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
RELEASES_PATH = Path("data/releases/scikit-learn.json")

# ---------------------------------------------------------------------------
# HTTP helper (mirrors update_stats.py pattern)
# ---------------------------------------------------------------------------

def fetch_json(url, token=None, _retries=4, _backoff=5):
    """Fetch a URL and return parsed JSON, or None on any error."""
    headers = {"User-Agent": "scikit-learn-central/reactions-bot"}
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
                print(f"      ✗ 404 Not Found: {url}")
                return None
            else:
                print(f"      ✗ HTTP {e.code}: {url}")
                return None
        except Exception as e:
            print(f"      ✗ {type(e).__name__}: {e}")
            return None
    print(f"      ✗ gave up after {_retries} attempts: {url}")
    return None


# ---------------------------------------------------------------------------
# Reaction fetching
# ---------------------------------------------------------------------------

def fetch_thumbsup_count(github_url, token=None):
    """
    Given a GitHub issue or PR URL, return the thumbs-up (+1) reaction count.

    Supports:
      https://github.com/{owner}/{repo}/issues/{number}
      https://github.com/{owner}/{repo}/pull/{number}
      https://github.com/{owner}/{repo}/pulls/{number}
    """
    parts = github_url.rstrip("/").split("/")
    if len(parts) < 7:
        print(f"      ✗ Unrecognised URL format: {github_url}")
        return None

    owner  = parts[-4]
    repo   = parts[-3]
    # kind = parts[-2]  # issues / pull / pulls — all map to /issues/ in API
    number = parts[-1]

    api_url = f"https://api.github.com/repos/{owner}/{repo}/issues/{number}"
    data = fetch_json(api_url, token=token)
    if data is None:
        return None

    count = data.get("reactions", {}).get("+1", 0)
    return count


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("⚠  No GITHUB_TOKEN found — GitHub API limited to 60 req/hour\n")

    releases_data = json.loads(RELEASES_PATH.read_text())

    updated = 0
    skipped = 0

    for rel in releases_data["releases"]:
        version = rel.get("version", "?")
        for h in rel.get("highlights", []):
            url = h.get("github_issue_url")
            if not url:
                skipped += 1
                continue

            print(f"  [{version}] {h['text'][:60]}")
            print(f"           {url}")
            count = fetch_thumbsup_count(url, token=token)
            if count is not None:
                h["reaction_count"] = count
                print(f"           👍 {count}")
                updated += 1
            else:
                h["reaction_count"] = None
                print(f"           ✗ could not fetch")

            time.sleep(0.25)   # stay well inside rate limits

    releases_data["meta"]["reactions_updated_at"] = (
        datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    )

    RELEASES_PATH.write_text(json.dumps(releases_data, indent=2) + "\n")
    print(f"\n✓  {RELEASES_PATH} updated — {updated} counts fetched, {skipped} highlights without issue URL")


if __name__ == "__main__":
    main()
