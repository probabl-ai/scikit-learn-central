<script setup lang="ts">
import { ref } from 'vue'

const endpoint = 'https://sklearn-central-mcp.probabl.workers.dev/mcp'

const tools = [
  {
    name: 'search_use_cases',
    icon: 'fa-magnifying-glass',
    line: 'q="fraud detection", tags=["banking"]',
    description:
      'Find use cases by free-text query and/or tag filters. Returns ranked metadata, ready to fetch.',
  },
  {
    name: 'get_use_case',
    icon: 'fa-file-code',
    line: 'id="fraud-detection-banking"',
    description:
      'Fetch the full metadata plus runnable Python source code for one use case.',
  },
  {
    name: 'list_packages',
    icon: 'fa-cubes',
    line: 'category="visualization"',
    description:
      'Browse the curated scikit-learn ecosystem catalog with categories, fit scores, and stats.',
  },
  {
    name: 'list_taxonomy',
    icon: 'fa-sitemap',
    line: 'kind="industry"',
    description:
      'Discover the valid filter values — industries, techniques, data types — used by the other tools.',
  },
]

type ClientKind = 'claude' | 'cursor'
const activeClient = ref<ClientKind>('claude')

const clientConfigs: Record<ClientKind, { label: string; path: string; json: string }> = {
  claude: {
    label: 'Claude Code',
    path: '.claude/mcp.json',
    json: `{
  "mcpServers": {
    "sklearn-central": {
      "command": "npx",
      "args": [
        "mcp-remote@latest",
        "${endpoint}"
      ]
    }
  }
}`,
  },
  cursor: {
    label: 'Cursor',
    path: '.cursor/mcp.json',
    json: `{
  "mcpServers": {
    "sklearn-central": {
      "command": "npx",
      "args": [
        "mcp-remote@latest",
        "${endpoint}"
      ]
    }
  }
}`,
  },
}

const sampleRequest = `curl -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "search_use_cases",
      "arguments": {"query": "fraud detection"}
    }
  }'`

const sampleResponse = `{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [{
      "type": "text",
      "text": "[
        {
          \\"id\\": \\"fraud-detection-banking\\",
          \\"title\\": \\"Fraud detection — banking\\",
          \\"packages\\": [\\"scikit-learn\\", \\"imbalanced-learn\\"],
          \\"tags\\": [\\"classification\\", \\"banking\\"]
        }
      ]"
    }]
  }
}`

// ── Copy-to-clipboard ────────────────────────────────────────────
const copied = ref<string | null>(null)
let copyTimer: number | null = null
async function copy(text: string, key: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = key
    if (copyTimer != null) clearTimeout(copyTimer)
    copyTimer = window.setTimeout(() => {
      copied.value = null
    }, 1600)
  } catch {
    /* clipboard rejected — silently ignore, the snippet is selectable */
  }
}

// ── Animated terminal "transit" ──────────────────────────────────
// A small pulsing dot on the dispatch board so the page feels alive.
</script>

<template>
  <div id="view-mcp" class="view mcp-view" role="tabpanel" aria-label="MCP Server">
    <div class="page-content mcp-page">
      <!-- ── Hero ─────────────────────────────────────────────── -->
      <section class="mcp-hero">
        <div class="mcp-hero__bg" aria-hidden="true">
          <div class="signal signal-a"></div>
          <div class="signal signal-b"></div>
          <div class="signal signal-c"></div>
        </div>

        <div class="mcp-hero__inner">
          <div class="mcp-hero__corner-tag">Platform 02</div>

          <div class="mcp-hero__eyebrow">
            <span class="spark"></span>
            Central Station · The Dispatch
          </div>
          <h1 class="mcp-hero__title">
            One endpoint, four tools, and the entire sklearn timetable.
          </h1>
          <p class="mcp-hero__lede">
            The MCP server is the station's dispatch room. It doesn't move
            anyone itself — it tells your agent which trains are running, where
            they go, and how to board them. Speak JSON-RPC over HTTP and the
            station replies.
          </p>

          <div class="mcp-endpoint">
            <span class="mcp-endpoint__chip">
              <span class="mcp-endpoint__led" aria-hidden="true"></span>
              ON AIR
            </span>
            <code class="mcp-endpoint__url">{{ endpoint }}</code>
            <button
              type="button"
              class="mcp-endpoint__copy"
              :class="{ 'is-copied': copied === 'endpoint' }"
              @click="copy(endpoint, 'endpoint')"
            >
              <i
                class="fas"
                :class="copied === 'endpoint' ? 'fa-check' : 'fa-copy'"
                aria-hidden="true"
              ></i>
              <span>{{ copied === 'endpoint' ? 'Copied' : 'Copy' }}</span>
            </button>
          </div>

          <div class="mcp-hero__meta">
            <span class="meta-item">
              <i class="fas fa-bolt" aria-hidden="true"></i>
              JSON-RPC 2.0 · Streamable HTTP
            </span>
            <span class="meta-item">
              <i class="fas fa-cloud" aria-hidden="true"></i>
              Cloudflare Workers · Python
            </span>
            <span class="meta-item meta-item--warn">
              <i class="fas fa-flask" aria-hidden="true"></i>
              Experimental
            </span>
          </div>
        </div>
      </section>

      <!-- ── Tools ─────────────────────────────────────────────── -->
      <section class="mcp-section">
        <div class="mcp-section__head">
          <span class="eyebrow"><span class="spark"></span>Tools on duty</span>
          <h2 class="mcp-section__title">Four tools the dispatch can call.</h2>
          <p class="mcp-section__lede">
            Every tool is a typed verb. Your agent picks one, the station
            answers with structured data — no scraping, no guesswork, no stale
            training data.
          </p>
        </div>

        <ul class="tool-grid">
          <li v-for="(t, i) in tools" :key="t.name" class="tool-card">
            <div class="tool-card__head">
              <span class="tool-card__index">T{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="tool-card__icon"><i class="fas" :class="t.icon"></i></span>
            </div>
            <div class="tool-card__name">{{ t.name }}</div>
            <div class="tool-card__call">
              <span class="tool-card__sigil">›</span>
              {{ t.line }}
            </div>
            <p class="tool-card__desc">{{ t.description }}</p>
          </li>
        </ul>
      </section>

      <!-- ── Connect ───────────────────────────────────────────── -->
      <section class="mcp-section mcp-section--dark">
        <div class="mcp-section__head">
          <span class="eyebrow eyebrow--dark"><span class="spark"></span>Board the line</span>
          <h2 class="mcp-section__title mcp-section__title--dark">
            Plug it into your AI coding assistant.
          </h2>
        </div>

        <div class="connect-card">
          <div class="connect-card__tabs" role="tablist">
            <button
              v-for="kind in (['claude', 'cursor'] as ClientKind[])"
              :key="kind"
              type="button"
              role="tab"
              class="connect-card__tab"
              :class="{ 'is-active': activeClient === kind }"
              :aria-selected="activeClient === kind"
              @click="activeClient = kind"
            >
              <i
                class="fas"
                :class="kind === 'claude' ? 'fa-robot' : 'fa-i-cursor'"
                aria-hidden="true"
              ></i>
              {{ clientConfigs[kind].label }}
            </button>
            <div class="connect-card__path">
              <i class="fas fa-folder-open" aria-hidden="true"></i>
              {{ clientConfigs[activeClient].path }}
            </div>
            <button
              type="button"
              class="connect-card__copy"
              :class="{ 'is-copied': copied === `cfg-${activeClient}` }"
              @click="copy(clientConfigs[activeClient].json, `cfg-${activeClient}`)"
            >
              <i
                class="fas"
                :class="copied === `cfg-${activeClient}` ? 'fa-check' : 'fa-copy'"
                aria-hidden="true"
              ></i>
              {{ copied === `cfg-${activeClient}` ? 'Copied' : 'Copy config' }}
            </button>
          </div>
          <pre class="connect-card__code"><code>{{ clientConfigs[activeClient].json }}</code></pre>
        </div>
      </section>

      <!-- ── Live transcript ───────────────────────────────────── -->
      <section class="mcp-section">
        <div class="mcp-section__head">
          <span class="eyebrow"><span class="spark"></span>Sample journey</span>
          <h2 class="mcp-section__title">A request boards the train. A response gets off.</h2>
          <p class="mcp-section__lede">
            Try it from the terminal — or any HTTP client. Below is one round
            trip against the live dispatch.
          </p>
        </div>

        <div class="transcript">
          <div class="transcript__pane transcript__pane--req">
            <div class="transcript__head">
              <span class="transcript__dot transcript__dot--req"></span>
              <span class="transcript__label">Request · POST</span>
              <button
                type="button"
                class="transcript__copy"
                :class="{ 'is-copied': copied === 'req' }"
                @click="copy(sampleRequest, 'req')"
              >
                <i
                  class="fas"
                  :class="copied === 'req' ? 'fa-check' : 'fa-copy'"
                ></i>
              </button>
            </div>
            <pre class="transcript__code"><code>{{ sampleRequest }}</code></pre>
          </div>
          <div class="transcript__arrow" aria-hidden="true">
            <svg viewBox="0 0 24 60" fill="none">
              <path d="M12 4 L12 56" stroke="#34366D" stroke-width="1.5" stroke-dasharray="3 4" />
              <path d="M6 50 L12 56 L18 50" stroke="#FF7900" stroke-width="1.5" fill="none" />
            </svg>
          </div>
          <div class="transcript__pane transcript__pane--res">
            <div class="transcript__head">
              <span class="transcript__dot transcript__dot--res"></span>
              <span class="transcript__label">Response · 200 OK</span>
            </div>
            <pre class="transcript__code"><code>{{ sampleResponse }}</code></pre>
          </div>
        </div>
      </section>

      <!-- ── Footer ────────────────────────────────────────────── -->
      <section class="mcp-foot">
        <div class="mcp-foot__copy">
          <h2 class="mcp-foot__title">Want the source code?</h2>
          <p class="mcp-foot__sub">
            The dispatch is a Cloudflare Python Worker — open source, deployed
            from <code>main</code>.
          </p>
        </div>
        <div class="mcp-foot__actions">
          <a
            href="https://github.com/probabl-ai/scikit-learn-central/tree/main/mcp"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn--primary"
          >
            <i class="fab fa-github" aria-hidden="true"></i>
            Read the source
          </a>
          <router-link to="/use-cases" class="btn btn--outline">
            <i class="fas fa-route" aria-hidden="true"></i>
            See an itinerary
          </router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.mcp-view {
  background: var(--bg-page);
  min-width: 0;
}

.mcp-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  padding-bottom: var(--space-12);
}

.spark {
  display: inline-block;
  width: 22px;
  height: 14px;
  background: url('/images/spark.svg') center/contain no-repeat;
  flex-shrink: 0;
}

.eyebrow.eyebrow--dark { color: var(--color-sky); }

/* ─────────────────────────────────────────────────────────────────
   Hero — dispatch room
   ───────────────────────────────────────────────────────────────── */
.mcp-hero {
  position: relative;
  background: var(--color-midnight);
  color: var(--text-inverse);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-midnight-line);
  padding: clamp(var(--space-8), 6vw, var(--space-12));
  overflow: hidden;
  isolation: isolate;
}

.mcp-hero__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse at 100% 0%,
    color-mix(in srgb, var(--color-orange) 22%, transparent) 0%,
    transparent 55%
  );
  z-index: 0;
}

.signal {
  position: absolute;
  border-radius: 50%;
  border: 1px solid var(--color-orange);
  opacity: 0;
  animation: signalPing 3.2s ease-out infinite;
}
.signal-a { right: 60px;  top: 60px;  width: 12px; height: 12px; animation-delay: 0s;   background: var(--color-orange); }
.signal-b { right: 50px;  top: 50px;  width: 32px; height: 32px; animation-delay: 0.6s; }
.signal-c { right: 40px;  top: 40px;  width: 52px; height: 52px; animation-delay: 1.2s; }
@keyframes signalPing {
  0%   { transform: scale(0.6); opacity: 0.75; }
  100% { transform: scale(1.7); opacity: 0; }
}

.mcp-hero__inner {
  position: relative;
  z-index: 1;
  max-width: 760px;
}

.mcp-hero__corner-tag {
  position: absolute;
  top: 0; right: 0;
  background: var(--color-orange);
  color: var(--color-near-black);
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  padding: 6px 14px;
  white-space: nowrap;
  transform: translate(clamp(0px, 4vw, 24px), -50%);
}

.mcp-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 12px;
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--color-sky);
  padding: 6px 14px;
  border: 1px solid var(--border-sky-on-dark-soft);
  border-radius: var(--radius-full);
  background: var(--surface-sky-on-dark-soft);
}

.mcp-hero__title {
  font-family: var(--brand-typography--title);
  font-size: clamp(2rem, 4.6vw, var(--brand-typography-size--heading-h2));
  font-weight: 300;
  letter-spacing: var(--tracking-display);
  line-height: 1.1;
  margin: var(--space-4) 0 var(--space-5);
  color: var(--text-inverse);
  max-width: 22ch;
}

.mcp-hero__lede {
  font-size: var(--brand-typography-size--body-l);
  line-height: 1.65;
  color: var(--text-on-dark-body);
  max-width: 60ch;
}

.mcp-endpoint {
  margin-top: var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
  background: var(--color-near-black);
  border: 1px solid var(--border-on-dark-default);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
}

.mcp-endpoint__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: var(--tracking-widest);
  color: var(--color-orange);
  padding: 3px 8px;
  border-radius: var(--radius-full);
  border: 1px solid color-mix(in srgb, var(--color-orange) 30%, transparent);
  background: var(--surface-orange-on-dark-soft);
  text-transform: uppercase;
}
.mcp-endpoint__led {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--color-orange);
  box-shadow: 0 0 10px var(--color-orange);
  animation: ledPulse 1.4s ease-in-out infinite;
}
@keyframes ledPulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
}

.mcp-endpoint__url {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-sky);
  flex: 1;
  min-width: 220px;
  word-break: break-all;
}

.mcp-endpoint__copy {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: transparent;
  border: 1px solid var(--border-on-dark-default);
  color: var(--text-inverse);
  padding: 8px 14px;
  border-radius: var(--radius-full);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  cursor: pointer;
  transition:
    background var(--duration-md) var(--ease-out),
    border-color var(--duration-md) var(--ease-out),
    transform var(--duration-press) var(--ease-out);
}
.mcp-endpoint__copy:hover { background: var(--surface-on-dark-faint); }
.mcp-endpoint__copy:active { transform: scale(0.97); }
.mcp-endpoint__copy.is-copied {
  background: var(--surface-on-dark-faint);
  color: var(--color-sky);
  border-color: var(--border-sky-on-dark-soft);
}

.mcp-hero__meta {
  margin-top: var(--space-5);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-5);
}
.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-on-dark-secondary);
  letter-spacing: var(--tracking-wide);
}
.meta-item i { color: var(--color-sky); }
.meta-item--warn i { color: var(--color-orange); }

/* ─────────────────────────────────────────────────────────────────
   Sections
   ───────────────────────────────────────────────────────────────── */
.mcp-section {
  padding: var(--space-8) 0;
}

.mcp-section--dark {
  background: var(--color-midnight);
  color: var(--text-inverse);
  border-radius: var(--radius-md);
  padding: clamp(var(--space-8), 5vw, var(--space-10)) clamp(var(--space-6), 4vw, var(--space-8));
}

.mcp-section__head {
  max-width: 640px;
  margin: 0 auto var(--space-7);
  text-align: center;
}

.mcp-section__title {
  font-family: var(--brand-typography--title);
  font-size: clamp(1.7rem, 3vw, var(--brand-typography-size--heading-h4));
  font-weight: 300;
  letter-spacing: var(--tracking-tight);
  line-height: 1.2;
  margin: var(--space-3) 0 var(--space-3);
  color: var(--text-primary);
}
.mcp-section__title--dark { color: var(--text-inverse); }

.mcp-section__lede {
  font-size: var(--brand-typography-size--body-l);
  line-height: 1.6;
  color: var(--text-muted);
}

/* ─────────────────────────────────────────────────────────────────
   Tools grid
   ───────────────────────────────────────────────────────────────── */
.tool-grid {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}
@media (max-width: 760px) {
  .tool-grid { grid-template-columns: 1fr; }
}

.tool-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-5) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition: transform var(--duration-md) var(--ease-out),
              border-color var(--duration-md) var(--ease-out),
              box-shadow var(--duration-md) var(--ease-out);
}
.tool-card:hover {
  transform: translateY(-3px);
  border-color: var(--color-near-black);
  box-shadow: var(--shadow-md);
}

.tool-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}
.tool-card__index {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: var(--tracking-widest);
  color: var(--color-orange);
}
.tool-card__icon {
  width: 36px; height: 36px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--surface-accent-subtle);
  color: var(--color-orange);
  border-radius: var(--radius-sm);
  font-size: 15px;
}
.tool-card__name {
  font-family: var(--font-mono);
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--text-primary);
}
.tool-card__call {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-sky);
  background: var(--color-near-black);
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-on-dark-hairline);
}
.tool-card__sigil { color: var(--color-orange); margin-right: 6px; }
.tool-card__desc {
  margin-top: auto;
  font-size: var(--brand-typography-size--body-m);
  color: var(--text-secondary);
  line-height: 1.6;
}

/* ─────────────────────────────────────────────────────────────────
   Connect card (Claude / Cursor)
   ───────────────────────────────────────────────────────────────── */
.connect-card {
  background: var(--color-near-black);
  border: 1px solid var(--border-on-dark-default);
  border-radius: var(--radius-md);
  overflow: hidden;
  max-width: 880px;
  margin: 0 auto;
}

.connect-card__tabs {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-3);
  background: rgb(255 255 255 / 0.03);
  border-bottom: 1px solid var(--border-on-dark-hairline);
  flex-wrap: wrap;
}

.connect-card__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid var(--border-on-dark-hairline);
  color: var(--text-on-dark-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  padding: 6px 12px;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background var(--duration-md) var(--ease-out),
              border-color var(--duration-md) var(--ease-out),
              color var(--duration-md) var(--ease-out);
}
.connect-card__tab:hover { color: var(--text-inverse); }
.connect-card__tab.is-active {
  background: var(--surface-orange-on-dark-soft);
  color: var(--color-orange);
  border-color: color-mix(in srgb, var(--color-orange) 35%, transparent);
}

.connect-card__path {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-on-dark-secondary);
  margin-left: var(--space-2);
  display: inline-flex; align-items: center; gap: 6px;
}
.connect-card__path i { color: var(--color-orange); }

.connect-card__copy {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid var(--border-on-dark-default);
  color: var(--text-inverse);
  padding: 6px 12px;
  border-radius: var(--radius-full);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: background var(--duration-md) var(--ease-out),
              transform var(--duration-press) var(--ease-out);
}
.connect-card__copy:hover { background: var(--surface-on-dark-faint); }
.connect-card__copy:active { transform: scale(0.97); }
.connect-card__copy.is-copied { color: var(--color-sky); border-color: var(--border-sky-on-dark-soft); }

.connect-card__code {
  margin: 0;
  padding: var(--space-5) var(--space-6);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-sky);
  white-space: pre;
  overflow-x: auto;
  line-height: 1.6;
}

/* ─────────────────────────────────────────────────────────────────
   Transcript (request → response)
   ───────────────────────────────────────────────────────────────── */
.transcript {
  display: grid;
  grid-template-columns: 1fr 24px 1fr;
  gap: var(--space-4);
  align-items: stretch;
}
@media (max-width: 880px) {
  .transcript { grid-template-columns: 1fr; }
  .transcript__arrow { transform: none; }
}

.transcript__pane {
  background: var(--color-near-black);
  border: 1px solid var(--border-on-dark-default);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.transcript__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-on-dark-hairline);
  background: rgb(255 255 255 / 0.03);
}
.transcript__dot {
  width: 10px; height: 10px; border-radius: 50%;
}
.transcript__dot--req { background: var(--color-orange); box-shadow: 0 0 8px var(--color-orange); }
.transcript__dot--res { background: var(--color-sky);    box-shadow: 0 0 8px var(--color-sky); }
.transcript__label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-widest);
  color: var(--text-on-dark-secondary);
  text-transform: uppercase;
}
.transcript__copy {
  margin-left: auto;
  background: transparent;
  border: 1px solid var(--border-on-dark-hairline);
  color: var(--text-on-dark-secondary);
  width: 30px; height: 30px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--duration-md) var(--ease-out);
}
.transcript__copy:hover { background: var(--surface-on-dark-faint); color: var(--text-inverse); }
.transcript__copy.is-copied { color: var(--color-sky); }

.transcript__code {
  margin: 0;
  padding: var(--space-4) var(--space-5);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-sky);
  white-space: pre;
  overflow-x: auto;
  line-height: 1.6;
  flex: 1;
}
.transcript__pane--req .transcript__code { color: var(--color-orange); }

.transcript__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
}
.transcript__arrow svg { width: 24px; height: 60px; }
@media (max-width: 880px) {
  .transcript__arrow svg { transform: rotate(0deg); }
}

/* ─────────────────────────────────────────────────────────────────
   Footer
   ───────────────────────────────────────────────────────────────── */
.mcp-foot {
  display: flex;
  gap: var(--space-6);
  align-items: center;
  justify-content: space-between;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-6) clamp(var(--space-5), 4vw, var(--space-8));
  flex-wrap: wrap;
}
.mcp-foot__title {
  font-family: var(--brand-typography--title);
  font-size: var(--brand-typography-size--heading-h6);
  font-weight: 300;
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}
.mcp-foot__sub {
  margin-top: var(--space-2);
  color: var(--text-muted);
  max-width: 60ch;
}
.mcp-foot__sub code {
  font-family: var(--font-mono);
  background: var(--neutral-100);
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}
.mcp-foot__actions {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}
</style>
