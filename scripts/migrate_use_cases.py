#!/usr/bin/env python3
"""
migrate_use_cases.py — One-time migration: monolithic use-cases.json → per-file structure.

Transforms data/use-cases.json from a single array of objects (with embedded
sample_code) into:
  - data/use-cases/{uuid}.json  — metadata only (no sample_code)
  - data/use-cases/{uuid}.py    — raw Python source code
  - data/use-cases.json         — lightweight index (list of UUIDs)

UUIDs are generated deterministically via uuid5 (URL namespace) seeded by
each use case's legacy `id` string, so re-running always produces the same
filenames.
"""

import json
import pathlib
import uuid

# uuid5 with URL namespace — deterministic, reproducible
NS = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')

ROOT = pathlib.Path(__file__).parent.parent
DATA = ROOT / 'data'
UC_DIR = DATA / 'use-cases'
UC_INDEX = DATA / 'use-cases.json'

# Step 1: Load existing monolithic file
print("Step 1: Loading data/use-cases.json …")
raw = json.loads(UC_INDEX.read_text())
use_cases = raw['use_cases']
print(f"        Found {len(use_cases)} use cases.")

# Step 2: Generate UUID mapping
print("Step 2: Generating UUID mapping …")
mapping = {}  # legacy_id → uuid_string
for uc in use_cases:
    mapping[uc['id']] = str(uuid.uuid5(NS, uc['id']))
    print(f"        {uc['id']!s:<45} → {mapping[uc['id']]}")

# Step 3: Create data/use-cases/ folder and write per-use-case files
print(f"\nStep 3: Writing individual files to {UC_DIR} …")
UC_DIR.mkdir(exist_ok=True)

for uc in use_cases:
    uid = mapping[uc['id']]

    # Write metadata JSON (no sample_code)
    meta = {
        "uuid":         uid,
        "slug":         uc['id'],
        "title":        uc['title'],
        "synopsis":     uc['synopsis'],
        "industry":     uc['industry'],
        "technique":    uc['technique'],
        "packages":     uc['packages'],
        "difficulty":   uc['difficulty'],
        "archived":     False,
        "has_notebook": False,
    }
    json_path = UC_DIR / f'{uid}.json'
    json_path.write_text(json.dumps(meta, indent=2, ensure_ascii=False) + '\n')

    # Write companion Python file
    py_path = UC_DIR / f'{uid}.py'
    py_path.write_text(uc['sample_code'])

    print(f"        Wrote {uid}.json + {uid}.py  ({uc['id']})")

# Step 4: Overwrite data/use-cases.json with the new index
print("\nStep 4: Writing new index to data/use-cases.json …")
new_index = {
    "meta": {
        "version": "4.0",
        "count": len(use_cases),
        "updated": "2026-03-01"
    },
    "use_cases": [mapping[uc['id']] for uc in use_cases]
}
UC_INDEX.write_text(json.dumps(new_index, indent=2) + '\n')
print(f"        Written ({len(use_cases)} UUIDs).")

# Step 5: Integrity check
print("\nStep 5: Verifying integrity …")
index = json.loads(UC_INDEX.read_text())
assert len(index['use_cases']) == len(use_cases), \
    f"Index has {len(index['use_cases'])} entries, expected {len(use_cases)}"
for uid in index['use_cases']:
    json_file = UC_DIR / f'{uid}.json'
    py_file   = UC_DIR / f'{uid}.py'
    assert json_file.exists(), f"Missing: {json_file}"
    assert py_file.exists(),   f"Missing: {py_file}"
    loaded = json.loads(json_file.read_text())
    assert loaded['uuid'] == uid,    f"uuid mismatch in {json_file}"
    assert 'sample_code' not in loaded, f"sample_code still present in {json_file}"
    assert not loaded['archived'],   f"Unexpected archived=true in {json_file}"

print(f"        All {len(use_cases)} use cases migrated and verified. ✓")
