"""scikit-learn Central MCP Server — Cloudflare Python Worker.

Implements the MCP Streamable HTTP transport (JSON-RPC 2.0 over HTTP POST).
Data is loaded from data_bundle.py, which is generated at build time by
generate_bundle.py and contains the use cases and package catalog inline.

Exposed tools:
  search_use_cases  — find use cases by free-text query and/or tag filters
  get_use_case      — fetch full metadata + Python source for one use case
  list_packages     — browse the 38-package sklearn ecosystem catalog
  list_taxonomy     — discover valid filter values before searching
"""
from js import Response, Headers
import json

from data_bundle import USE_CASES, PACKAGES

# ── Indices built once at module load ─────────────────────────────────────
_UC_BY_ID: dict = {}
for _uc in USE_CASES:
    _UC_BY_ID[_uc["uuid"]] = _uc
    _UC_BY_ID[_uc["slug"]] = _uc

_ALL_INDUSTRIES = sorted({i for uc in USE_CASES for i in uc.get("industry", [])})
_ALL_TECHNIQUES = sorted({t for uc in USE_CASES for t in uc.get("technique", [])})
_ALL_DIFFICULTIES = sorted({uc["difficulty"] for uc in USE_CASES if uc.get("difficulty")})
_ALL_PKG_IDS = [p["id"] for p in PACKAGES]

# ── Tool definitions (returned by tools/list) ─────────────────────────────
_TOOLS = [
    {
        "name": "search_use_cases",
        "description": (
            "Search the scikit-learn Central use case library. Returns ranked matches "
            "with metadata. Use this when the user describes a machine learning problem, "
            "industry, or technique they want to implement in Python."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": (
                        "Free-text description of the ML problem "
                        "(e.g. 'fraud detection for banking', 'predict customer churn')"
                    ),
                },
                "industry": {
                    "type": "string",
                    "description": (
                        f"Filter by industry. Valid values: {', '.join(_ALL_INDUSTRIES)}"
                    ),
                },
                "technique": {
                    "type": "string",
                    "description": (
                        f"Filter by ML technique. Valid values: {', '.join(_ALL_TECHNIQUES)}"
                    ),
                },
                "difficulty": {
                    "type": "string",
                    "enum": ["beginner", "intermediate", "advanced"],
                    "description": "Filter by difficulty level",
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum results to return (default 3, max 10)",
                    "default": 3,
                },
            },
        },
    },
    {
        "name": "get_use_case",
        "description": (
            "Get full details and the complete runnable Python source code for a specific "
            "use case. Call this after search_use_cases to retrieve the code example."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "string",
                    "description": "UUID or slug of the use case (from search_use_cases results)",
                }
            },
            "required": ["id"],
        },
    },
    {
        "name": "list_packages",
        "description": (
            "List packages in the scikit-learn ecosystem catalog with descriptions and tags. "
            "Use when the user asks what libraries are available for a task, or what a "
            "specific package (e.g. skrub, skore) does."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "tag": {
                    "type": "string",
                    "description": (
                        "Filter by tag (e.g. 'time-series', 'explainability', "
                        "'categorical-encoding', 'evaluation')"
                    ),
                },
                "query": {
                    "type": "string",
                    "description": "Free-text filter against package name and description",
                },
            },
        },
    },
    {
        "name": "list_taxonomy",
        "description": (
            "Returns all valid taxonomy values: industries, techniques, difficulty levels, "
            "and package IDs. Call this first to discover what filter values are available "
            "before calling search_use_cases."
        ),
        "inputSchema": {"type": "object", "properties": {}},
    },
]

# ── Search ────────────────────────────────────────────────────────────────

def _score(uc: dict, query: str, industry: str, technique: str, difficulty: str) -> float:
    if uc.get("archived"):
        return 0.0
    if industry and industry not in uc.get("industry", []):
        return 0.0
    if technique and technique not in uc.get("technique", []):
        return 0.0
    if difficulty and uc.get("difficulty") != difficulty:
        return 0.0
    if not query:
        return 1.0

    q = query.lower()
    tokens = set(q.split())
    score = 0.0

    title = uc.get("title", "").lower()
    synopsis = uc.get("synopsis", "").lower()
    tags = " ".join(
        uc.get("industry", []) + uc.get("technique", []) + uc.get("packages", [])
    ).lower()

    score += 2.0 if q in title else sum(0.5 for t in tokens if t in title)
    score += 1.5 if q in synopsis else sum(0.3 for t in tokens if t in synopsis)
    score += sum(0.8 for t in tokens if t in tags)
    return score


def _without_code(uc: dict) -> dict:
    return {k: v for k, v in uc.items() if k != "source_code"}


# ── Tool handlers ─────────────────────────────────────────────────────────

def _tool_search_use_cases(args: dict) -> str:
    query = args.get("query", "").strip()
    industry = (args.get("industry") or "").strip()
    technique = (args.get("technique") or "").strip()
    difficulty = (args.get("difficulty") or "").strip()
    limit = min(int(args.get("limit", 3)), 10)

    scored = [
        (s, uc)
        for uc in USE_CASES
        if (s := _score(uc, query, industry, technique, difficulty)) > 0
    ]
    scored.sort(key=lambda x: x[0], reverse=True)

    results = []
    for s, uc in scored[:limit]:
        item = _without_code(uc)
        item["score"] = round(s, 2)
        results.append(item)

    return json.dumps(results, indent=2)


def _tool_get_use_case(args: dict) -> str:
    uc_id = args.get("id", "").strip()
    uc = _UC_BY_ID.get(uc_id)
    if not uc:
        return json.dumps({
            "error": f"Use case not found: {uc_id!r}. "
                     "Use search_use_cases to discover valid IDs."
        })
    result = dict(uc)
    if result.get("source_code") is None:
        result["source_code"] = "# Source code not available."
    return json.dumps(result, indent=2)


def _tool_list_packages(args: dict) -> str:
    tag = (args.get("tag") or "").lower().strip()
    query = (args.get("query") or "").lower().strip()

    results = []
    for pkg in PACKAGES:
        if tag and tag not in [t.lower() for t in pkg.get("tags", [])]:
            continue
        if query:
            haystack = (pkg.get("name", "") + " " + pkg.get("description", "")).lower()
            if query not in haystack:
                continue
        results.append({
            "id": pkg["id"],
            "name": pkg["name"],
            "description": pkg["description"],
            "tags": pkg["tags"],
            "website": pkg.get("website", ""),
            "docs": pkg.get("docs", ""),
        })
    return json.dumps(results, indent=2)


def _tool_list_taxonomy(_args: dict) -> str:
    return json.dumps({
        "industries": _ALL_INDUSTRIES,
        "techniques": _ALL_TECHNIQUES,
        "difficulties": _ALL_DIFFICULTIES,
        "packages": _ALL_PKG_IDS,
        "use_case_count": len(USE_CASES),
    }, indent=2)


_HANDLERS = {
    "search_use_cases": _tool_search_use_cases,
    "get_use_case": _tool_get_use_case,
    "list_packages": _tool_list_packages,
    "list_taxonomy": _tool_list_taxonomy,
}

# ── MCP JSON-RPC 2.0 dispatch ─────────────────────────────────────────────

def _dispatch(rpc: dict) -> dict | None:
    msg_id = rpc.get("id")
    method = rpc.get("method", "")

    # Notifications have no id and require no response
    if msg_id is None:
        return None

    def ok(result):
        return {"jsonrpc": "2.0", "id": msg_id, "result": result}

    def err(code, message):
        return {"jsonrpc": "2.0", "id": msg_id, "error": {"code": code, "message": message}}

    if method == "initialize":
        return ok({
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "sklearn-central", "version": "1.0.0"},
        })

    if method == "tools/list":
        return ok({"tools": _TOOLS})

    if method == "tools/call":
        params = rpc.get("params", {})
        name = params.get("name", "")
        handler = _HANDLERS.get(name)
        if not handler:
            return err(-32601, f"Unknown tool: {name!r}")
        try:
            text = handler(params.get("arguments", {}))
            return ok({"content": [{"type": "text", "text": text}]})
        except Exception as exc:
            return err(-32603, str(exc))

    return err(-32601, f"Method not found: {method!r}")


# ── HTTP entry point ──────────────────────────────────────────────────────

_CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Mcp-Session-Id",
}


def _respond(data, status: int = 200):
    headers = Headers.new({**_CORS, "Content-Type": "application/json"}.items())
    return Response.new(json.dumps(data), status=status, headers=headers)


async def on_fetch(request, env, ctx):
    method = request.method.upper()

    if method == "OPTIONS":
        return Response.new("", status=204, headers=Headers.new(_CORS.items()))

    if method == "GET":
        headers = Headers.new({**_CORS, "Content-Type": "text/plain"}.items())
        return Response.new(
            f"sklearn-central MCP server — {len(USE_CASES)} use cases, "
            f"{len(PACKAGES)} packages",
            status=200,
            headers=headers,
        )

    if method != "POST":
        return _respond({"error": "Method not allowed"}, status=405)

    body = await request.text()
    try:
        rpc = json.loads(body)
    except Exception:
        return _respond(
            {"jsonrpc": "2.0", "id": None,
             "error": {"code": -32700, "message": "Parse error"}},
            status=400,
        )

    result = _dispatch(rpc)
    if result is None:
        # Notification acknowledged — no body
        return Response.new("", status=202, headers=Headers.new(_CORS.items()))

    return _respond(result)
