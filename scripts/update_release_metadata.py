#!/usr/bin/env python3
"""
Fetch changelog tag counts, contributor counts, and optionally auto-populate
highlights for scikit-learn releases from the scikit-learn documentation.

Borrows parsing strategies from:
  https://github.com/francoisgoupil/sklearn-release-post

Adds a "stats" sub-object to each release in data/releases/scikit-learn.json:
  {
    "tag_counts": {
      "major_feature": N, "feature": N, "efficiency": N,
      "enhancement": N, "fix": N, "api_change": N
    },
    "contributor_count": N   # page-level; covers the full major.minor series
  }

Highlights are auto-populated only when highlights[] is empty (preserves
manual curation by default). Use --force-highlights to overwrite.

Usage:
  python3 scripts/update_release_metadata.py              # fetch missing stats
  python3 scripts/update_release_metadata.py --dry-run    # preview only
  python3 scripts/update_release_metadata.py --version 1.6.0
  python3 scripts/update_release_metadata.py --force
  python3 scripts/update_release_metadata.py --force-highlights

Requirements:
  pip install requests beautifulsoup4 lxml
"""

import argparse
import json
import os
import re
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit("Missing dependencies. Run: pip install requests beautifulsoup4 lxml")

# ---------------------------------------------------------------------------
# Paths and constants
# ---------------------------------------------------------------------------

RELEASES_PATH = Path("data/releases/scikit-learn.json")
REQUEST_DELAY = 1.0  # seconds between page fetches (polite crawling)

# Tag types in order of specificity: most specific must come first so that
# "Major Feature" is matched before "Feature", "API Change" before generic hits.
TAG_TYPES = [
    "Major Feature",
    "API Change",
    "Feature",
    "Efficiency",
    "Enhancement",
    "Fix",
]

# Human-readable label → JSON key (snake_case)
TAG_KEYS = {
    "Major Feature": "major_feature",
    "API Change":    "api_change",
    "Feature":       "feature",
    "Efficiency":    "efficiency",
    "Enhancement":   "enhancement",
    "Fix":           "fix",
}

# Heading patterns to skip when extracting highlights from the highlights page
_SKIP_HEADING_RE = re.compile(
    r"^(Release Highlights|Contents|Navigation|Examples using|Note|Warning)",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args():
    p = argparse.ArgumentParser(
        description="Fetch changelog tag counts, contributor counts, and auto-populate "
                    "highlights for scikit-learn releases."
    )
    p.add_argument(
        "--version", action="append", metavar="VERSION",
        help="Only process this version (e.g. 1.6.0). Repeatable.",
    )
    p.add_argument(
        "--force", action="store_true",
        help="Re-fetch and overwrite existing tag_counts and contributor_count.",
    )
    p.add_argument(
        "--force-highlights", action="store_true",
        help="Re-fetch highlights even for releases that already have them.",
    )
    p.add_argument(
        "--dry-run", action="store_true",
        help="Print what would be updated without writing to disk.",
    )
    return p.parse_args()


# ---------------------------------------------------------------------------
# HTTP helper (mirrors update_release_reactions.py style, uses requests)
# ---------------------------------------------------------------------------

def fetch_html(url, session, retries=4, backoff=5):
    """
    Fetch a URL and return (BeautifulSoup, status_code).
    Returns (None, status_code) on non-retryable errors.
    Returns (None, None) after exhausting retries.
    """
    for attempt in range(1, retries + 1):
        try:
            r = session.get(url, timeout=15)
            if r.status_code == 200:
                return BeautifulSoup(r.text, "lxml"), 200
            elif r.status_code == 404:
                print(f"      ✗ 404 Not Found: {url}")
                return None, 404
            elif r.status_code == 429 and attempt < retries:
                wait = backoff * attempt
                print(f"      ↺ 429 rate-limit, retrying in {wait}s (attempt {attempt}/{retries}) …")
                time.sleep(wait)
            else:
                print(f"      ✗ HTTP {r.status_code}: {url}")
                return None, r.status_code
        except Exception as e:
            print(f"      ✗ {type(e).__name__}: {e}")
            return None, None
    print(f"      ✗ gave up after {retries} attempts: {url}")
    return None, None


# ---------------------------------------------------------------------------
# URL builders
# ---------------------------------------------------------------------------

def changelog_url(version_str):
    """Return the whats_new page URL for a version (shared by all patches)."""
    parts = version_str.split(".")
    return f"https://scikit-learn.org/stable/whats_new/v{parts[0]}.{parts[1]}.html"


def section_anchor(version_str):
    """Return the HTML anchor id for a specific version section."""
    return "version-" + version_str.replace(".", "-")


def highlights_url(version_str):
    """Return the release highlights page URL (always uses major.minor.0)."""
    parts = version_str.split(".")
    return (
        "https://scikit-learn.org/stable/auto_examples/release_highlights/"
        f"plot_release_highlights_{parts[0]}_{parts[1]}_0.html"
    )


# ---------------------------------------------------------------------------
# HTML parsing helpers
# ---------------------------------------------------------------------------

def _collect_list_items(section_el):
    """
    Collect all <li> elements from a changelog version section.

    Handles two Sphinx HTML layouts:
    - New-style (Sphinx 4+): id is on a <section> element → find_all("li")
    - Old-style: id is on a heading → walk next siblings until same-level heading
    """
    if section_el.name == "section":
        return section_el.find_all("li")

    # Old-style: heading element. Walk forward siblings until a heading of
    # the same or higher level (lower number) is encountered.
    heading_level = int(section_el.name[1])  # e.g. "h2" → 2
    items = []
    for sibling in section_el.find_next_siblings():
        if sibling.name and sibling.name[0] == "h":
            try:
                if int(sibling.name[1]) <= heading_level:
                    break
            except ValueError:
                pass
        if hasattr(sibling, "find_all"):
            items.extend(sibling.find_all("li"))
    return items


def count_tags(soup, version_str):
    """
    Count changelog tag occurrences in the version-specific section.

    Tags are matched in specificity order (Major Feature before Feature, etc.)
    with a break after the first match per <li> item, exactly as in the
    reference generate_linkedin_post.py script.

    Returns a dict of TAG_KEYS values → counts, or None if section not found.
    """
    anchor_id = section_anchor(version_str)
    section_el = soup.find(id=anchor_id)
    if section_el is None:
        print(f"      ✗ anchor #{anchor_id} not found in page")
        return None

    counts = {v: 0 for v in TAG_KEYS.values()}
    tag_patterns = {
        t: re.compile(r"\b" + re.escape(t) + r"\b", re.IGNORECASE)
        for t in TAG_TYPES
    }

    for li in _collect_list_items(section_el):
        text = li.get_text(" ", strip=True)
        for tag_type in TAG_TYPES:  # most-specific first
            if tag_patterns[tag_type].search(text):
                counts[TAG_KEYS[tag_type]] += 1
                break  # one tag per list item

    return counts


def count_contributors(soup):
    """
    Count contributors from the "Code and documentation contributors" section.

    This count is page-level and covers the entire major.minor release cycle
    (all patch releases on the same whats_new page share the same count).

    Scikit-learn docs use a Sphinx rubric directive which renders as
    <p class="rubric">Code and documentation contributors</p> followed by
    an intro <p> and then a <p> with comma-separated contributor names.

    Returns an int, or None if the section is not found.
    """
    # Primary: Sphinx rubric (<p class="rubric">)
    heading = soup.find(
        "p",
        class_="rubric",
        string=lambda t: t and "Code and documentation contributors" in t,
    )
    # Fallback: plain heading tags (older doc versions)
    if heading is None:
        heading = soup.find(
            lambda tag: tag.name in ("h2", "h3", "h4", "h5")
            and "Code and documentation contributors" in tag.get_text()
        )
    if heading is None:
        return None

    # Skip the "Thanks to everyone..." intro paragraph, use the names paragraph
    next_p_tags = [s for s in heading.find_next_siblings() if s.name == "p"]
    container = None
    for p in next_p_tags[:3]:
        text = p.get_text()
        if "Thanks to everyone" in text or "thanks to everyone" in text:
            continue
        container = p
        break

    if container is None:
        container = heading.find_next(["p", "div"])
    if container is None:
        return None

    raw = container.get_text(separator=",")
    candidates = [c.strip() for c in raw.split(",")]

    _common = {"and", "the", "of", "in", "for", "to", "a", "an", "by",
               "thanks", "everyone", "including", "with", "from"}
    names = []
    for c in candidates:
        if not c or len(c) < 2:
            continue
        # Allow "dependabot[bot]" but reject "v1.5" or similar digit strings
        if re.search(r"\d", c) and not re.search(r"\[bot\]", c, re.IGNORECASE):
            continue
        if c.lower() in _common:
            continue
        names.append(c)

    return len(names) if names else None


def extract_highlights(soup):
    """
    Extract highlight headings from a release highlights page.

    Primary: H2 headings (skipping the page title and nav headings).
    Fallback: H3/H4 headings, then first meaningful <li> items.

    Returns a list of highlight dicts compatible with the scikit-learn.json schema.
    """
    results = []

    def _clean(text):
        return re.sub(r"[#¶\s]+$", "", text).strip()

    # Primary: H2 headings
    for h2 in soup.find_all("h2"):
        text = _clean(h2.get_text(" ", strip=True))
        if len(text) < 8 or _SKIP_HEADING_RE.match(text):
            continue
        results.append({"text": text, "github_issue_url": None, "reaction_count": None})

    if results:
        return results

    # Fallback: H3/H4
    for tag_name in ("h3", "h4"):
        for hN in soup.find_all(tag_name):
            text = _clean(hN.get_text(" ", strip=True))
            if len(text) < 8 or _SKIP_HEADING_RE.match(text):
                continue
            results.append({"text": text, "github_issue_url": None, "reaction_count": None})
        if results:
            return results

    # Final fallback: first meaningful <li> items
    for li in soup.find_all("li"):
        text = _clean(li.get_text(" ", strip=True))
        if 15 <= len(text) <= 200:
            results.append({"text": text[:150], "github_issue_url": None, "reaction_count": None})
        if len(results) >= 8:
            break

    return results


# ---------------------------------------------------------------------------
# Per-release decision helpers
# ---------------------------------------------------------------------------

def should_process(rel, args):
    """Return True if this release should be included in this run."""
    version = rel.get("version", "")
    if version == "future":
        return False
    if args.version and version not in args.version:
        return False
    return True


def needs_stats_fetch(rel, args):
    """Return True if tag_counts or contributor_count need fetching."""
    if args.force:
        return True
    existing = rel.get("stats", {})
    return (existing.get("tag_counts") is None
            or existing.get("contributor_count") is None)


def needs_highlights_fetch(rel, args):
    """Return True if highlights should be (re-)fetched from the docs."""
    highlights = rel.get("highlights", [])
    if highlights:
        return args.force_highlights  # only overwrite manual curation if asked
    return True  # always populate empty highlights


# ---------------------------------------------------------------------------
# Page-level processing
# ---------------------------------------------------------------------------

def process_changelog_page(url, versions_on_page, session):
    """
    Fetch and parse one whats_new page.

    Returns a dict: version_str → {"tag_counts": dict|None, "contributor_count": int|None}
    The contributor_count is the same for all versions on the page (page-level data).
    """
    print(f"  fetching changelog: {url}")
    soup, status = fetch_html(url, session)
    if soup is None:
        return {}

    contributor_count = count_contributors(soup)
    if contributor_count is not None:
        print(f"    contributors: {contributor_count}")
    else:
        print(f"    contributors: section not found")

    results = {}
    for version_str in versions_on_page:
        tag_counts = count_tags(soup, version_str)
        if tag_counts is not None:
            total = sum(tag_counts.values())
            print(f"    [{version_str}] tags: {total} total  "
                  f"({', '.join(f'{k}={v}' for k, v in tag_counts.items() if v)})")
        results[version_str] = {
            "tag_counts":        tag_counts,
            "contributor_count": contributor_count,
        }

    time.sleep(REQUEST_DELAY)
    return results


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    args = parse_args()

    if not RELEASES_PATH.exists():
        sys.exit(f"✗  {RELEASES_PATH} not found — run from the project root")

    releases_data = json.loads(RELEASES_PATH.read_text())
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    session = requests.Session()
    session.headers.update({"User-Agent": "scikit-learn-central/metadata-bot"})

    # ── Step 1: fetch changelog pages ────────────────────────────────────────
    print("── Step 1: fetching changelog tag counts and contributors ───────")

    # Group releases by their shared changelog URL to fetch each page only once
    changelog_groups = defaultdict(list)
    for rel in releases_data["releases"]:
        if not should_process(rel, args):
            continue
        if needs_stats_fetch(rel, args):
            url = changelog_url(rel["version"])
            changelog_groups[url].append(rel["version"])

    changelog_results = {}  # version_str → {tag_counts, contributor_count}
    for url, versions in changelog_groups.items():
        page_results = process_changelog_page(url, versions, session)
        changelog_results.update(page_results)

    if not changelog_groups:
        print("  nothing to fetch (all stats already present; use --force to refresh)")

    # ── Step 2: fetch highlights pages ───────────────────────────────────────
    print("\n── Step 2: fetching release highlights ──────────────────────────")

    highlights_cache = {}   # highlights_url → list of highlight dicts | None
    highlights_updated = 0

    for rel in releases_data["releases"]:
        if not should_process(rel, args):
            continue
        version = rel.get("version")
        if not needs_highlights_fetch(rel, args):
            print(f"  [{version}] highlights: skipped (already populated)")
            continue

        h_url = highlights_url(version)
        if h_url not in highlights_cache:
            print(f"  [{version}] fetching highlights: {h_url}")
            soup, status = fetch_html(h_url, session)
            if soup is None:
                highlights_cache[h_url] = None
            else:
                highlights_cache[h_url] = extract_highlights(soup)
            time.sleep(REQUEST_DELAY)
        else:
            print(f"  [{version}] highlights: using cached page")

        extracted = highlights_cache.get(h_url)
        if extracted:
            print(f"  [{version}] highlights: {len(extracted)} extracted")
            if not args.dry_run:
                rel["highlights"] = extracted
            highlights_updated += 1
        else:
            print(f"  [{version}] highlights: none found on page")

    # ── Step 3: merge stats ───────────────────────────────────────────────────
    print("\n── Step 3: merging stats ────────────────────────────────────────")
    stats_updated = 0

    for rel in releases_data["releases"]:
        version = rel.get("version")
        if version not in changelog_results:
            continue
        result = changelog_results[version]

        has_tags    = result["tag_counts"] is not None
        has_contribs = result["contributor_count"] is not None

        if not args.dry_run:
            if "stats" not in rel:
                rel["stats"] = {}
            if has_tags:
                rel["stats"]["tag_counts"] = result["tag_counts"]
            if has_contribs:
                rel["stats"]["contributor_count"] = result["contributor_count"]

        label = []
        if has_tags:
            label.append(f"tags={sum(result['tag_counts'].values())}")
        if has_contribs:
            label.append(f"contributors={result['contributor_count']}")
        print(f"  [{version}] " + (", ".join(label) if label else "no data"))
        stats_updated += 1

    # ── Write output ──────────────────────────────────────────────────────────
    if not args.dry_run:
        releases_data["meta"]["metadata_updated_at"] = now
        RELEASES_PATH.write_text(json.dumps(releases_data, indent=2) + "\n")
        print(
            f"\n✓  {RELEASES_PATH} updated — "
            f"{stats_updated} release(s) with stats, "
            f"{highlights_updated} release(s) with new highlights"
        )
    else:
        print(
            f"\n[dry-run] no changes written — "
            f"would update {stats_updated} stats, {highlights_updated} highlights"
        )


if __name__ == "__main__":
    main()
