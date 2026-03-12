# [EXPERIMENTAL] scikit-learn Central MCP Server

A remote MCP server that exposes the scikit-learn Central use case library and
ecosystem catalog to AI coding assistants (Claude Code, Cursor, etc.).

Once connected, Claude can call tools to retrieve curated, runnable Python
examples and discover the sklearn ecosystem — without relying on potentially
outdated training data.

## Tools

| Tool | Description |
|---|---|
| `search_use_cases` | Find use cases by free-text query and/or tag filters |
| `get_use_case` | Fetch full metadata + Python source code for one use case |
| `list_packages` | Browse the 38-package sklearn ecosystem catalog |
| `list_taxonomy` | Discover valid filter values (industries, techniques, etc.) |

## Connecting to the deployed server

The server is deployed at:
```
https://sklearn-central-mcp.probabl.workers.dev/mcp
```

### Claude Code

Add to `.claude/mcp.json` in your project root (or `~/.claude.json` globally):

```json
{
  "mcpServers": {
    "sklearn-central": {
      "command": "npx",
      "args": ["mcp-remote@latest", "https://sklearn-central-mcp.probabl.workers.dev/mcp"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project (or `~/.cursor/mcp.json` globally):

```json
{
  "mcpServers": {
    "sklearn-central": {
      "command": "npx",
      "args": ["mcp-remote@latest", "https://sklearn-central-mcp.probabl.workers.dev/mcp"]
    }
  }
}
```

## Local development

Prerequisites: Node.js 18+, Python 3.8+, a [Cloudflare account](https://dash.cloudflare.com).

```bash
# Install wrangler
npm install -g wrangler

# From the mcp/ directory:
cd mcp

# Generate the data bundle (required before first run)
python3 generate_bundle.py

# Start local dev server (wrangler calls generate_bundle.py automatically)
wrangler dev
```

The local server runs at `http://localhost:8787`. Test it:

```bash
# Health check
curl http://localhost:8787

# Initialize
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# List tools
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Search use cases
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_use_cases","arguments":{"query":"fraud detection"}}}'

# Get a use case with source code
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_use_case","arguments":{"id":"fraud-detection-banking"}}}'
```

## Deployment

### Manual

```bash
cd mcp
wrangler deploy
```

### Automatic (GitHub Actions)

The `.github/workflows/deploy-mcp.yml` workflow deploys automatically on every
push to `main` that touches `data/` or `mcp/` files.

**Required secret:** Add `CLOUDFLARE_API_TOKEN` to your repository's secrets
(Settings → Secrets → Actions). The token needs the **Workers Scripts: Edit**
permission.

## Architecture

```
mcp/
├── generate_bundle.py   # Reads ../data/, writes data_bundle.py
├── worker.py            # Cloudflare Python Worker — MCP JSON-RPC handler
├── wrangler.toml        # Worker config; [build] runs generate_bundle.py
├── .gitignore           # Excludes data_bundle.py (generated)
└── README.md
```

Data from the repository's `data/` directory is baked into `data_bundle.py` at
build time. The Worker serves it statically — no filesystem I/O at request time.

The server implements [MCP Streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports)
(JSON-RPC 2.0 over HTTP POST).
