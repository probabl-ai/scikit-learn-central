<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePackages } from '@/composables/usePackages'
import { useReleases } from '@/composables/useReleases'
import { useUseCases } from '@/composables/useUseCases'
import { fmt } from '@/utils/format'

const router = useRouter()
const { packages } = usePackages()
const { useCases } = useUseCases()
const { releaseCount } = useReleases()

interface Platform {
  num: string
  eyebrow: string
  title: string
  analogy: string
  description: string
  count: number | null
  countLabel: string
  cta: string
  to: string | null
  external?: string
  tone: 'sky' | 'orange' | 'mist' | 'violet'
  iconKind: 'train' | 'station' | 'timetable' | 'map'
  status: 'live' | 'soon'
}

const platforms = computed<Platform[]>(() => [
  {
    num: '01',
    eyebrow: 'Trains',
    title: 'Ecosystem Catalog',
    analogy: 'Python libraries — the engines that do the work',
    description:
      'Specialised vehicles for specific jobs. Browse the curated ecosystem of scikit-learn compatible packages, ranked by ecosystem fit.',
    count: packages.value.length || null,
    countLabel: 'packages on track',
    cta: 'Board the trains',
    to: '/catalog',
    tone: 'sky',
    iconKind: 'train',
    status: 'live',
  },
  {
    num: '02',
    eyebrow: 'Central Station',
    title: 'MCP Server',
    analogy: 'The dispatch system — routes requests, manages platforms',
    description:
      'The station never moves anyone; it grants access to the trains. An MCP server exposes the ecosystem to AI agents through four typed tools.',
    count: 4,
    countLabel: 'tools dispatched',
    cta: 'Visit the dispatch',
    to: '/mcp',
    tone: 'orange',
    iconKind: 'station',
    status: 'live',
  },
  {
    num: '03',
    eyebrow: 'Timetables',
    title: 'Skills',
    analogy: 'Route maps — readable instructions for any journey',
    description:
      '“Take the 9:15 from Platform 3, change at Y.” Skills describe how to accomplish a task without you needing to know how diesel engines work.',
    count: 1,
    countLabel: 'timetable published',
    cta: 'Read the timetable',
    to: '/skills',
    tone: 'violet',
    iconKind: 'timetable',
    status: 'live',
  },
  {
    num: '04',
    eyebrow: 'Itineraries',
    title: 'Use Cases',
    analogy: 'Sample travel guides — concrete journeys end-to-end',
    description:
      'A real journey: Paris → Lyon → Rome, with the right connections. Concrete demonstrations of the ecosystem solving real ML problems.',
    count: useCases.value.length || null,
    countLabel: 'itineraries booked',
    cta: 'Explore journeys',
    to: '/use-cases',
    tone: 'mist',
    iconKind: 'map',
    status: 'live',
  },
])

// ── Departure board ───────────────────────────────────────────────
// A small lookup of "live numbers" that flip in on mount. Each metric is a
// {label, value} pair; the value is animated character-by-character so it
// feels like a station departure board waking up.
interface DepartureRow {
  code: string
  label: string
  value: string
  destination: string
  tone: 'sky' | 'orange' | 'mist'
}

const departures = computed<DepartureRow[]>(() => [
  {
    code: 'SK · 01',
    label: 'Packages',
    value: String(packages.value.length).padStart(3, '0'),
    destination: 'Catalog',
    tone: 'sky',
  },
  {
    code: 'UC · 02',
    label: 'Use cases',
    value: String(useCases.value.length).padStart(3, '0'),
    destination: 'Itineraries',
    tone: 'orange',
  },
  {
    code: 'RL · 03',
    label: 'Releases',
    value: String(releaseCount.value).padStart(3, '0'),
    destination: 'Changelog',
    tone: 'mist',
  },
])

// ── Departure board flip animation ────────────────────────────────
// We animate the digits by cycling through 0-9 a few times before settling
// on the real value. JS-driven so it stays in sync across rows.
const flipChars = '0123456789'
const animatedValues = ref<string[]>(['000', '000', '000'])
let flipRaf: number | null = null
let flipFrame = 0

function startFlip(): void {
  if (typeof window === 'undefined') return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const targets = departures.value.map((d) => d.value)
  if (reduce) {
    animatedValues.value = targets
    return
  }
  const totalFrames = 24
  const step = (): void => {
    flipFrame += 1
    const progress = Math.min(flipFrame / totalFrames, 1)
    animatedValues.value = targets.map((target) => {
      let out = ''
      for (let i = 0; i < target.length; i++) {
        // Each digit settles slightly later than the one before it; gives a
        // cascading flip rather than every wheel landing at once.
        const settle = Math.min(1, progress + 0.05 - i * 0.06)
        if (settle >= 1) {
          out += target[i]
        } else {
          out += flipChars[Math.floor(Math.random() * flipChars.length)]
        }
      }
      return out
    })
    if (progress < 1) {
      flipRaf = window.requestAnimationFrame(step)
    } else {
      animatedValues.value = targets
      flipRaf = null
    }
  }
  flipRaf = window.requestAnimationFrame(step)
}

// ── Clock ──────────────────────────────────────────────────────
const now = ref(new Date())
let clockTimer: number | null = null
const clockLabel = computed(() =>
  now.value.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }),
)

onMounted(() => {
  startFlip()
  clockTimer = window.setInterval(() => {
    now.value = new Date()
  }, 30_000)
})

onBeforeUnmount(() => {
  if (flipRaf != null) cancelAnimationFrame(flipRaf)
  if (clockTimer != null) clearInterval(clockTimer)
})

function goToPlatform(p: Platform): void {
  if (p.to) {
    void router.push(p.to)
  } else if (p.external) {
    window.open(p.external, '_blank', 'noopener,noreferrer')
  }
}

// Pulse the platform indicator on each card; offset per card so they don't
// blink in unison.
function pulseDelay(i: number): string {
  return `${(i * 0.45).toFixed(2)}s`
}
</script>

<template>
  <div id="view-home" class="view home-view" role="tabpanel" aria-label="scikit-learn Central home">
    <!-- ── Hero — Midnight station scene ────────────────────────── -->
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-bg" aria-hidden="true">
        <div class="hero-stars">
          <span
            v-for="i in 28"
            :key="i"
            class="star"
            :style="{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 61) % 100}%`,
              animationDelay: `${(i % 7) * 0.4}s`,
            }"
          ></span>
        </div>
        <svg class="hero-tracks" viewBox="0 0 1600 240" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="trackFade" x1="0" x2="1">
              <stop offset="0" stop-color="#34366D" stop-opacity="0" />
              <stop offset="0.3" stop-color="#34366D" stop-opacity="0.55" />
              <stop offset="0.7" stop-color="#34366D" stop-opacity="0.55" />
              <stop offset="1" stop-color="#34366D" stop-opacity="0" />
            </linearGradient>
          </defs>
          <g stroke="url(#trackFade)" stroke-width="2" fill="none">
            <path d="M0 80 L1600 80" />
            <path d="M0 120 L1600 120" />
            <path d="M0 160 L1600 160" />
          </g>
          <!-- ties -->
          <g fill="#1B1D58">
            <rect v-for="i in 40" :key="`tie-${i}`" :x="(i - 1) * 42" y="74" width="22" height="6" rx="1" />
            <rect v-for="i in 40" :key="`tie2-${i}`" :x="(i - 1) * 42 + 10" y="114" width="22" height="6" rx="1" />
            <rect v-for="i in 40" :key="`tie3-${i}`" :x="(i - 1) * 42 + 20" y="154" width="22" height="6" rx="1" />
          </g>
        </svg>

        <!-- Animated maglev pod sliding across (neon-electric punk) -->
        <div class="hero-train" aria-hidden="true">
          <svg viewBox="0 0 220 70" width="220" height="70" fill="none">
            <!-- energy contrails trailing off the rear -->
            <ellipse class="puff puff-a" cx="14" cy="32" rx="16" ry="2.5" fill="#4CD0FF" opacity="0.55" />
            <ellipse class="puff puff-b" cx="10" cy="40" rx="18" ry="2.2" fill="#FF7900" opacity="0.5" />
            <ellipse class="puff puff-c" cx="14" cy="48" rx="16" ry="2" fill="#4CD0FF" opacity="0.4" />
            <!-- maglev underglow rail (replacing wheels) -->
            <ellipse cx="110" cy="62" rx="105" ry="4" fill="#FF7900" opacity="0.28" />
            <rect x="14" y="58" width="194" height="2.5" rx="1.2" fill="#FF7900" />
            <rect x="14" y="58" width="194" height="0.8" fill="#FFD27F" opacity="0.85" />
            <!-- main capsule hull (bulbous, curved — single fluid form) -->
            <path d="M 12 38
                     C 12 24, 28 18, 44 18
                     L 158 18
                     C 184 18, 206 26, 210 36
                     C 206 46, 184 54, 158 54
                     L 44 54
                     C 28 54, 12 50, 12 38 Z"
                  fill="#0E1049" stroke="#4CD0FF" stroke-width="1.5" />
            <!-- amber forward accent panel (the bright orange highlight on the nose) -->
            <path d="M 158 19
                     C 184 20, 204 26, 210 33
                     C 202 28, 184 24, 158 23 Z"
                  fill="#FF7900" opacity="0.95" />
            <!-- amber rear accent strip -->
            <path d="M 44 19
                     C 28 20, 14 26, 12 34
                     C 16 28, 30 24, 44 23 Z"
                  fill="#FF7900" opacity="0.6" />
            <!-- continuous neon window band -->
            <path d="M 38 28
                     C 40 26, 44 26, 52 26
                     L 168 26
                     C 188 27, 200 31, 204 36
                     C 200 41, 188 45, 168 46
                     L 52 46
                     C 44 46, 40 45, 38 43 Z"
                  fill="#4CD0FF" opacity="0.55" />
            <path d="M 38 28
                     C 40 26, 44 26, 52 26
                     L 168 26
                     C 188 27, 200 31, 204 36
                     C 200 41, 188 45, 168 46
                     L 52 46
                     C 44 46, 40 45, 38 43 Z"
                  fill="none" stroke="#FF7900" stroke-width="0.8" opacity="0.85" />
            <!-- inner window dividers -->
            <g stroke="#0E1049" stroke-width="0.9" opacity="0.9">
              <line x1="58" y1="27" x2="58" y2="45" />
              <line x1="78" y1="27" x2="78" y2="45" />
              <line x1="98" y1="27" x2="98" y2="45" />
              <line x1="118" y1="27" x2="118" y2="45" />
              <line x1="138" y1="27" x2="138" y2="45" />
              <line x1="158" y1="27" x2="158" y2="45" />
            </g>
            <!-- glowing interior light streaks -->
            <g fill="#FFFFFF" opacity="0.45">
              <rect x="42" y="30" width="14" height="1.2" />
              <rect x="62" y="30" width="14" height="1.2" />
              <rect x="82" y="30" width="14" height="1.2" />
              <rect x="102" y="30" width="14" height="1.2" />
              <rect x="122" y="30" width="14" height="1.2" />
              <rect x="142" y="30" width="14" height="1.2" />
            </g>
            <!-- cockpit pod (forward bubble with amber edge) -->
            <path d="M 168 28
                     C 188 28, 202 32, 208 36
                     C 202 40, 188 44, 168 44 Z"
                  fill="#4CD0FF" opacity="0.55" stroke="#FF7900" stroke-width="1.2" />
            <!-- pilot silhouette inside cockpit -->
            <circle cx="190" cy="33" r="2.2" fill="#040524" opacity="0.75" />
            <path d="M 187 35 L 193 35 L 194 41 L 186 41 Z" fill="#040524" opacity="0.75" />
            <!-- headlight beams (cyan + amber) -->
            <path class="beam" d="M 210 33 L 252 26 L 252 46 L 210 39 Z" fill="#4CD0FF" opacity="0.4" />
            <path d="M 208 35 L 234 30 L 234 41 L 208 38 Z" fill="#FF7900" opacity="0.7" />
            <!-- downward maglev thruster vents -->
            <g fill="#4CD0FF" opacity="0.9">
              <rect x="46" y="54" width="10" height="2.5" rx="1.2" />
              <rect x="82" y="54" width="10" height="2.5" rx="1.2" />
              <rect x="118" y="54" width="10" height="2.5" rx="1.2" />
              <rect x="154" y="54" width="10" height="2.5" rx="1.2" />
            </g>
          </svg>
        </div>
      </div>

      <div class="hero-inner">
        <div class="hero-eyebrow">
          <span class="spark"></span>
          <span>Welcome to The Central</span>
        </div>
        <h1 id="hero-title" class="hero-title">
          One station for the
          <span class="hero-title__accent">scikit-learn</span>
          ecosystem.
        </h1>
        <p class="hero-lede">
          A central terminus where Python libraries are
          <strong>trains</strong>, an MCP server is the
          <strong>dispatch</strong>, skills are the
          <strong>timetables</strong>, and use cases are the
          <strong>itineraries</strong> that pull it all together.
        </p>

        <div class="hero-cta">
          <router-link to="/catalog" class="btn btn--primary">
            <i class="fas fa-train" aria-hidden="true"></i>
            Board the trains
          </router-link>
          <router-link to="/use-cases" class="btn btn--ghost">
            <i class="fas fa-route" aria-hidden="true"></i>
            Plan a journey
          </router-link>
        </div>

        <!-- Departure board strip -->
        <div class="board" aria-label="Live counts">
          <div class="board-head">
            <span class="board-led" aria-hidden="true"></span>
            <span class="board-label">Now Departing</span>
            <span class="board-clock" :title="now.toString()">{{ clockLabel }}</span>
          </div>
          <ul class="board-rows">
            <li
              v-for="(row, i) in departures"
              :key="row.code"
              class="board-row"
              :class="`board-row--${row.tone}`"
            >
              <span class="board-row__code">{{ row.code }}</span>
              <span class="board-row__digits">{{ animatedValues[i] }}</span>
              <span class="board-row__label">{{ row.label }}</span>
              <span class="board-row__dot" aria-hidden="true">·</span>
              <span class="board-row__dest">→ {{ row.destination }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- ── Map: 4 platforms ────────────────────────────────────── -->
    <section class="platforms-section" aria-labelledby="platforms-title">
      <div class="section-head">
        <span class="eyebrow"><span class="spark"></span>The Station Map</span>
        <h2 id="platforms-title" class="section-title">Four platforms, one terminus.</h2>
        <p class="section-lede">
          Every part of scikit-learn Central plays a clear role. Pick a platform
          to board.
        </p>
      </div>

      <div class="platforms" role="list">
        <article
          v-for="(p, i) in platforms"
          :key="p.num"
          class="platform"
          :class="[`platform--${p.tone}`, p.status === 'soon' && 'platform--soon']"
          role="listitem"
          tabindex="0"
          @click="goToPlatform(p)"
          @keydown.enter.prevent="goToPlatform(p)"
          @keydown.space.prevent="goToPlatform(p)"
        >
          <div class="platform-rail" aria-hidden="true">
            <span class="platform-rail__indicator" :style="{ animationDelay: pulseDelay(i) }"></span>
            <span class="platform-rail__label">Platform</span>
            <span class="platform-rail__num">{{ p.num }}</span>
          </div>

          <div class="platform-body">
            <div class="platform-head">
              <span class="platform-eyebrow">{{ p.eyebrow }}</span>
              <span v-if="p.status === 'soon'" class="platform-pill platform-pill--soon">
                <span class="platform-pill__dot"></span>Coming Soon
              </span>
              <span v-else class="platform-pill platform-pill--live">
                <span class="platform-pill__dot"></span>On time
              </span>
            </div>

            <h3 class="platform-title">{{ p.title }}</h3>
            <p class="platform-analogy">{{ p.analogy }}</p>
            <p class="platform-desc">{{ p.description }}</p>

            <!-- Per-platform illustration -->
            <div class="platform-art" aria-hidden="true">
              <!-- TRAIN (neon-electric maglev pod) -->
              <svg v-if="p.iconKind === 'train'" viewBox="0 0 200 70" fill="none">
                <!-- maglev underglow rail -->
                <ellipse cx="100" cy="62" rx="95" ry="3" fill="#FF7900" opacity="0.28" />
                <rect x="10" y="58" width="180" height="2.2" rx="1.1" fill="#FF7900" />
                <rect x="10" y="58" width="180" height="0.7" fill="#FFD27F" opacity="0.85" />
                <!-- main capsule hull -->
                <path d="M 10 36
                         C 10 22, 26 18, 40 18
                         L 144 18
                         C 168 18, 188 24, 192 34
                         C 188 44, 168 50, 144 50
                         L 40 50
                         C 26 50, 10 46, 10 36 Z"
                      fill="#0E1049" stroke="#4CD0FF" stroke-width="1.3" />
                <!-- amber forward accent -->
                <path d="M 144 19
                         C 166 20, 184 25, 190 31
                         C 182 27, 166 24, 144 23 Z"
                      fill="#FF7900" opacity="0.95" />
                <!-- amber rear accent -->
                <path d="M 40 19
                         C 26 20, 14 25, 10 32
                         C 16 28, 28 24, 40 23 Z"
                      fill="#FF7900" opacity="0.6" />
                <!-- neon window band -->
                <path d="M 32 28
                         C 34 26, 38 26, 44 26
                         L 154 26
                         C 172 27, 184 30, 186 34
                         C 184 40, 172 43, 154 44
                         L 44 44
                         C 38 44, 34 43, 32 41 Z"
                      fill="#4CD0FF" opacity="0.6" />
                <!-- window dividers -->
                <g stroke="#0E1049" stroke-width="0.7" opacity="0.85">
                  <line x1="52" y1="27" x2="52" y2="43" />
                  <line x1="72" y1="27" x2="72" y2="43" />
                  <line x1="92" y1="27" x2="92" y2="43" />
                  <line x1="112" y1="27" x2="112" y2="43" />
                  <line x1="132" y1="27" x2="132" y2="43" />
                </g>
                <!-- interior light streaks -->
                <g fill="#FFFFFF" opacity="0.4">
                  <rect x="38" y="30" width="12" height="1" />
                  <rect x="58" y="30" width="12" height="1" />
                  <rect x="78" y="30" width="12" height="1" />
                  <rect x="98" y="30" width="12" height="1" />
                  <rect x="118" y="30" width="12" height="1" />
                </g>
                <!-- cockpit pod -->
                <path d="M 154 28
                         C 172 28, 184 32, 190 35
                         C 184 38, 172 42, 154 42 Z"
                      fill="#4CD0FF" opacity="0.55" stroke="#FF7900" stroke-width="1" />
                <!-- pilot silhouette -->
                <circle cx="170" cy="32" r="1.7" fill="#040524" opacity="0.75" />
                <path d="M 168 34 L 173 34 L 173 38 L 168 38 Z" fill="#040524" opacity="0.75" />
                <!-- headlight beam -->
                <path d="M 190 33 L 200 30 L 200 40 L 190 37 Z" fill="#FF7900" opacity="0.7" />
                <!-- thrusters -->
                <g fill="#4CD0FF" opacity="0.9">
                  <rect x="40" y="50" width="8" height="2.2" rx="1" />
                  <rect x="68" y="50" width="8" height="2.2" rx="1" />
                  <rect x="96" y="50" width="8" height="2.2" rx="1" />
                  <rect x="124" y="50" width="8" height="2.2" rx="1" />
                </g>
                <!-- rail line -->
                <line x1="0" y1="64" x2="200" y2="64" stroke="#34366D" stroke-width="1.5" />
              </svg>
              <!-- STATION = MCP dispatch tower with 4 tools as broadcast lobes -->
              <svg v-else-if="p.iconKind === 'station'" viewBox="0 0 200 90" fill="none">
                <!-- ground -->
                <line x1="0" y1="80" x2="200" y2="80" stroke="#34366D" stroke-width="1.5" />
                <!-- dispatch base -->
                <path d="M52 80 L62 52 L138 52 L148 80 Z" fill="#0E1049" stroke="#FF7900" stroke-width="1.5" />
                <!-- tower -->
                <rect x="92" y="22" width="16" height="30" fill="#040524" stroke="#FF7900" stroke-width="1.2" />
                <!-- mast -->
                <line x1="100" y1="22" x2="100" y2="6" stroke="#FF7900" stroke-width="1.5" />
                <circle cx="100" cy="6" r="2.5" fill="#FF7900" />
                <!-- broadcast arcs (3 waves) -->
                <path d="M84 16 A 18 18 0 0 1 116 16" stroke="#FF7900" stroke-width="1.2" fill="none" opacity="0.85" />
                <path d="M74 18 A 28 28 0 0 1 126 18" stroke="#FF7900" stroke-width="1.2" fill="none" opacity="0.55" stroke-dasharray="2 3" />
                <path d="M64 20 A 38 38 0 0 1 136 20" stroke="#FF7900" stroke-width="1.2" fill="none" opacity="0.3" stroke-dasharray="2 4" />
                <!-- 4 tool platforms (one per MCP tool) -->
                <g font-family="JetBrains Mono, monospace" font-size="6.5" fill="#CCCCD7" text-anchor="middle">
                  <rect x="10" y="62" width="34" height="18" rx="2" fill="#040524" stroke="#4CD0FF" stroke-width="1" />
                  <text x="27" y="74">search</text>

                  <rect x="156" y="62" width="34" height="18" rx="2" fill="#040524" stroke="#4CD0FF" stroke-width="1" />
                  <text x="173" y="74">get</text>

                  <rect x="10" y="38" width="34" height="18" rx="2" fill="#040524" stroke="#4CD0FF" stroke-width="1" />
                  <text x="27" y="50">packages</text>

                  <rect x="156" y="38" width="34" height="18" rx="2" fill="#040524" stroke="#4CD0FF" stroke-width="1" />
                  <text x="173" y="50">taxonomy</text>
                </g>
                <!-- thin lines from tower to each tool -->
                <g stroke="#4CD0FF" stroke-width="0.8" opacity="0.55" stroke-dasharray="1 2">
                  <line x1="92"  y1="38" x2="44"  y2="47" />
                  <line x1="108" y1="38" x2="156" y2="47" />
                  <line x1="92"  y1="52" x2="44"  y2="71" />
                  <line x1="108" y1="52" x2="156" y2="71" />
                </g>
              </svg>
              <!-- TIMETABLE = canonical sklearn-expert workflow board -->
              <svg v-else-if="p.iconKind === 'timetable'" viewBox="0 0 200 90" fill="none">
                <rect x="14" y="8" width="172" height="74" rx="4" fill="#040524" stroke="#7C3AED" stroke-width="1.5" />
                <!-- header -->
                <line x1="14" y1="24" x2="186" y2="24" stroke="#7C3AED" stroke-width="1" />
                <text x="22" y="20" fill="#CCCCD7" font-family="JetBrains Mono, monospace" font-size="8">SKILL · sklearn-expert</text>
                <text x="156" y="20" fill="#4CD0FF" font-family="JetBrains Mono, monospace" font-size="8">v0.1.0</text>
                <!-- 4 workflow rows: time · stage · library -->
                <g font-family="JetBrains Mono, monospace" font-size="7.5">
                  <text x="22" y="36" fill="#4CD0FF">09:15</text>
                  <text x="58" y="36" fill="#FFFFFF">Prepare</text>
                  <text x="108" y="36" fill="#CCCCD7">▸ skrub</text>

                  <text x="22" y="49" fill="#FF7900">10:40</text>
                  <text x="58" y="49" fill="#FFFFFF">Model</text>
                  <text x="108" y="49" fill="#CCCCD7">▸ sklearn</text>

                  <text x="22" y="62" fill="#7C3AED">12:05</text>
                  <text x="58" y="62" fill="#FFFFFF">Evaluate</text>
                  <text x="108" y="62" fill="#CCCCD7">▸ skore</text>

                  <text x="22" y="75" fill="#CCCCD7">14:32</text>
                  <text x="58" y="75" fill="#FFFFFF">Compare</text>
                  <text x="108" y="75" fill="#CCCCD7">▸ skore</text>
                </g>
                <!-- platform dots -->
                <circle cx="176" cy="34" r="2" fill="#4CD0FF" />
                <circle cx="176" cy="47" r="2" fill="#FF7900" />
                <circle cx="176" cy="60" r="2" fill="#7C3AED" />
                <circle cx="176" cy="73" r="2" fill="#CCCCD7" />
              </svg>
              <!-- MAP -->
              <svg v-else viewBox="0 0 200 90" fill="none">
                <!-- routes -->
                <path d="M14 70 C 60 60, 60 30, 100 26 S 160 50, 188 24" stroke="#4CD0FF" stroke-width="2" stroke-dasharray="2 3" />
                <path d="M14 30 C 50 36, 70 60, 110 64 S 170 40, 188 60" stroke="#FF7900" stroke-width="2" stroke-dasharray="2 3" />
                <!-- stops -->
                <g>
                  <circle cx="14" cy="70" r="4" fill="#4CD0FF" />
                  <circle cx="100" cy="26" r="4" fill="#4CD0FF" />
                  <circle cx="188" cy="24" r="4" fill="#4CD0FF" />
                  <circle cx="14" cy="30" r="4" fill="#FF7900" />
                  <circle cx="110" cy="64" r="4" fill="#FF7900" />
                  <circle cx="188" cy="60" r="4" fill="#FF7900" />
                </g>
                <!-- labels -->
                <g font-family="JetBrains Mono, monospace" font-size="7" fill="#CCCCD7">
                  <text x="22" y="70" dy="3">A</text>
                  <text x="106" y="26" dy="3">B</text>
                  <text x="172" y="20">C</text>
                  <text x="22" y="30" dy="3">A</text>
                  <text x="116" y="64" dy="3">B</text>
                  <text x="172" y="56">C</text>
                </g>
              </svg>
            </div>

            <div class="platform-foot">
              <div class="platform-meta">
                <span class="platform-meta__count" v-if="p.count != null">
                  {{ fmt(p.count) }}
                </span>
                <span class="platform-meta__label">{{ p.countLabel }}</span>
              </div>
              <span class="platform-cta">
                {{ p.cta }}
                <i class="fas fa-arrow-right" aria-hidden="true"></i>
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- ── How it works — three steps ──────────────────────────── -->
    <section class="howitworks" aria-labelledby="howitworks-title">
      <div class="section-head">
        <span class="eyebrow"><span class="spark"></span>How a journey works</span>
        <h2 id="howitworks-title" class="section-title">From “I have a problem” to “done”.</h2>
      </div>

      <ol class="steps">
        <li class="step">
          <div class="step-no">01</div>
          <h3 class="step-title">Pick your destination</h3>
          <p class="step-desc">
            Describe what you need to do. The MCP dispatch knows which trains run
            where — no need to study the whole timetable.
          </p>
        </li>
        <li class="step step--mid">
          <div class="step-connector" aria-hidden="true">
            <svg viewBox="0 0 80 24" fill="none">
              <path d="M2 12 L78 12" stroke="#34366D" stroke-width="1.5" stroke-dasharray="3 3" />
              <path d="M70 6 L78 12 L70 18" stroke="#FF7900" stroke-width="1.5" fill="none" />
            </svg>
          </div>
          <div class="step-no">02</div>
          <h3 class="step-title">Follow the timetable</h3>
          <p class="step-desc">
            Skills give you the human-readable route: which trains to board, where
            to change, what to expect at each stop along the way.
          </p>
        </li>
        <li class="step">
          <div class="step-connector" aria-hidden="true">
            <svg viewBox="0 0 80 24" fill="none">
              <path d="M2 12 L78 12" stroke="#34366D" stroke-width="1.5" stroke-dasharray="3 3" />
              <path d="M70 6 L78 12 L70 18" stroke="#FF7900" stroke-width="1.5" fill="none" />
            </svg>
          </div>
          <div class="step-no">03</div>
          <h3 class="step-title">Borrow a known itinerary</h3>
          <p class="step-desc">
            Or skip ahead — adapt a use case someone already shipped. Read it,
            fork it, ride it home.
          </p>
        </li>
      </ol>
    </section>

    <!-- ── Final CTA ───────────────────────────────────────────── -->
    <section class="final-cta">
      <div class="final-cta__inner">
        <div class="final-cta__copy">
          <span class="eyebrow"><span class="spark"></span>Ready to board?</span>
          <h2 class="final-cta__title">
            The 14:32 to a working model is on Platform 01.
          </h2>
          <p class="final-cta__sub">
            scikit-learn Central is governed by Probabl, with the help of an
            open community. Featured packages are picked by editors; everything
            else is ranked by a transparent Fit Score.
          </p>
        </div>
        <div class="final-cta__actions">
          <router-link to="/catalog" class="btn btn--primary">
            <i class="fas fa-train" aria-hidden="true"></i>
            Browse the catalog
          </router-link>
          <router-link to="/about" class="btn btn--outline final-cta__about">
            <i class="fas fa-circle-info" aria-hidden="true"></i>
            About the project
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-view {
  background: var(--bg-page);
  min-width: 0;
  overflow-x: clip;
}

/* ─────────────────────────────────────────────────────────────────
   Section heads — reused below the hero
   ───────────────────────────────────────────────────────────────── */
.section-head {
  max-width: 720px;
  margin: 0 auto var(--space-8);
  padding: 0 var(--space-6);
  text-align: center;
}

.section-title {
  font-family: var(--brand-typography--title);
  font-size: clamp(2rem, 4vw, var(--brand-typography-size--heading-h3));
  font-weight: 300;
  letter-spacing: var(--tracking-tight);
  line-height: 1.15;
  color: var(--text-primary);
  margin-top: var(--space-3);
}

.section-lede {
  margin-top: var(--space-3);
  color: var(--text-muted);
  font-size: var(--brand-typography-size--body-l);
  line-height: 1.6;
}

.spark {
  display: inline-block;
  width: 22px;
  height: 14px;
  background: url('/images/spark.svg') center/contain no-repeat;
  flex-shrink: 0;
}

/* ─────────────────────────────────────────────────────────────────
   Hero — immersive midnight station
   ───────────────────────────────────────────────────────────────── */
.hero {
  position: relative;
  isolation: isolate;
  background: var(--color-midnight);
  color: var(--text-inverse);
  overflow: hidden;
  padding: clamp(var(--space-10), 8vw, var(--space-16)) var(--space-6) clamp(var(--space-10), 6vw, var(--space-12));
}

.hero::before {
  /* radial sky-blue glow centered on the hero, fades out toward edges */
  content: '';
  position: absolute;
  inset: -10% -5% auto -5%;
  height: 70%;
  background: radial-gradient(
    ellipse at 50% 0%,
    color-mix(in srgb, var(--color-sky) 18%, transparent) 0%,
    transparent 60%
  );
  pointer-events: none;
  z-index: 0;
}

.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.hero-stars { position: absolute; inset: 0; }
.star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: var(--color-sky);
  border-radius: 50%;
  opacity: 0.4;
  animation: starTwinkle 3.6s ease-in-out infinite;
}
@keyframes starTwinkle {
  0%, 100% { opacity: 0.2; transform: scale(0.8); }
  50%      { opacity: 0.8; transform: scale(1.1); }
}

.hero-tracks {
  position: absolute;
  left: -5%;
  right: -5%;
  bottom: 8%;
  width: 110%;
  height: 220px;
  opacity: 0.85;
}

.hero-train {
  position: absolute;
  bottom: calc(8% + 50px);
  left: -260px;
  width: 220px;
  height: 70px;
  animation: trainRoll 18s linear infinite;
  filter: drop-shadow(0 8px 18px rgba(76, 208, 255, 0.18));
}
.hero-train svg { overflow: visible; }
@keyframes trainRoll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(calc(100vw + 260px)); }
}

.puff { animation: puffRise 1.6s ease-out infinite; transform-origin: center; }
.puff-b { animation-delay: 0.4s; }
.puff-c { animation-delay: 0.8s; }
@keyframes puffRise {
  0%   { transform: translate(0, 0) scaleX(1); opacity: 0.85; }
  100% { transform: translate(-44px, -2px) scaleX(0.25); opacity: 0; }
}

.beam { animation: beamFlicker 2.4s ease-in-out infinite; transform-origin: 214px 36px; }
@keyframes beamFlicker {
  0%, 100% { opacity: 0.18; }
  45%      { opacity: 0.42; }
  60%      { opacity: 0.22; }
}

.hero-inner {
  position: relative;
  z-index: 1;
  max-width: 920px;
  margin: 0 auto;
  text-align: center;
}

.hero-eyebrow {
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
  backdrop-filter: blur(6px);
}

.hero-title {
  font-family: var(--brand-typography--title);
  font-size: clamp(2.5rem, 6vw, var(--brand-typography-size--heading-h1));
  font-weight: 300;
  letter-spacing: var(--tracking-display);
  line-height: 1.05;
  margin: var(--space-5) auto var(--space-5);
  max-width: 18ch;
  color: var(--text-inverse);
}

.hero-title__accent {
  font-style: italic;
  background: linear-gradient(90deg, var(--color-sky) 0%, var(--color-orange) 80%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-lede {
  font-size: var(--brand-typography-size--body-l);
  line-height: 1.65;
  color: var(--text-on-dark-body);
  max-width: 620px;
  margin: 0 auto;
}
.hero-lede strong { color: var(--text-inverse); font-weight: 600; }

.hero-cta {
  margin-top: var(--space-7);
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
}

/* ─────────────────────────────────────────────────────────────────
   Departure board strip (live counts)
   ───────────────────────────────────────────────────────────────── */
.board {
  margin: var(--space-8) auto 0;
  max-width: 720px;
  background: var(--color-near-black);
  border: 1px solid var(--border-on-dark-hairline);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
  text-align: left;
  box-shadow: var(--shadow-midnight-deep);
  position: relative;
  overflow: hidden;
}

.board::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    180deg,
    transparent 0,
    transparent 2px,
    rgb(255 255 255 / 0.02) 3px
  );
  pointer-events: none;
}

.board-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding-bottom: var(--space-2);
  border-bottom: 1px dashed var(--border-on-dark-hairline);
  margin-bottom: var(--space-2);
}

.board-led {
  width: 8px;
  height: 8px;
  background: var(--color-orange);
  border-radius: 50%;
  box-shadow: 0 0 12px var(--color-orange);
  animation: ledPulse 1.6s ease-in-out infinite;
}
@keyframes ledPulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
}

.board-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-widest);
  color: var(--color-orange);
  text-transform: uppercase;
  flex: 1;
}

.board-clock {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-sky);
  font-variant-numeric: tabular-nums;
}

.board-rows {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.board-row {
  display: grid;
  grid-template-columns: 70px 64px 1fr auto auto;
  align-items: baseline;
  gap: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  padding: 4px 0;
}

.board-row__code {
  color: var(--text-on-dark-muted);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
}

.board-row__digits {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: var(--text-lg);
  letter-spacing: 2px;
  font-variant-numeric: tabular-nums;
}
.board-row--sky    .board-row__digits { color: var(--color-sky); }
.board-row--orange .board-row__digits { color: var(--color-orange); }
.board-row--mist   .board-row__digits { color: var(--color-mist); }

.board-row__label {
  color: var(--text-on-dark-body);
}

.board-row__dot { color: var(--text-on-dark-faint); }

.board-row__dest {
  color: var(--text-on-dark-secondary);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

/* ─────────────────────────────────────────────────────────────────
   Platforms (the 4 cards)
   ───────────────────────────────────────────────────────────────── */
.platforms-section {
  padding: clamp(var(--space-10), 8vw, var(--space-16)) 0;
  max-width: 1200px;
  margin: 0 auto;
}

.platforms {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5);
  padding: 0 var(--space-6);
}

@media (max-width: 760px) {
  .platforms { grid-template-columns: 1fr; }
}

.platform {
  position: relative;
  display: flex;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  isolation: isolate;
  transition:
    transform var(--duration-md) var(--ease-out),
    border-color var(--duration-md) var(--ease-out),
    box-shadow var(--duration-md) var(--ease-out);
}

.platform:hover,
.platform:focus-visible {
  transform: translateY(-3px);
  border-color: var(--color-near-black);
  box-shadow: var(--shadow-md);
  outline: none;
}

.platform:focus-visible {
  box-shadow: var(--focus-ring-sky-strong), var(--shadow-md);
}

/* Subtle accent stripe at the top — picks up the tone color */
.platform::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: var(--platform-accent, var(--color-sky));
  z-index: 1;
}

.platform--sky    { --platform-accent: var(--color-sky); }
.platform--orange { --platform-accent: var(--color-orange); }
.platform--violet { --platform-accent: #7C3AED; }
.platform--mist   { --platform-accent: var(--color-graphite); }

.platform-rail {
  position: relative;
  flex: 0 0 84px;
  background: var(--color-midnight);
  color: var(--text-inverse);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: var(--space-6) var(--space-2);
  gap: var(--space-2);
  border-right: 1px dashed var(--color-midnight-line);
}

.platform-rail__indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--platform-accent);
  box-shadow: 0 0 0 0 var(--platform-accent);
  animation: platformPulse 2.6s ease-out infinite;
  margin-top: var(--space-2);
}
@keyframes platformPulse {
  0%   { box-shadow: 0 0 0 0   color-mix(in srgb, var(--platform-accent) 55%, transparent); }
  70%  { box-shadow: 0 0 0 12px color-mix(in srgb, var(--platform-accent) 0%, transparent); }
  100% { box-shadow: 0 0 0 0   color-mix(in srgb, var(--platform-accent) 0%, transparent); }
}

.platform-rail__label {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--text-on-dark-muted);
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  margin-top: auto;
}

.platform-rail__num {
  font-family: var(--brand-typography--title);
  font-size: var(--brand-typography-size--heading-h4);
  font-weight: 300;
  letter-spacing: var(--tracking-tight);
  color: var(--text-inverse);
  line-height: 1;
  margin-top: 0;
}

.platform-body {
  flex: 1;
  padding: var(--space-5) var(--space-6) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
}

.platform-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.platform-eyebrow {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--platform-accent);
  font-weight: 600;
}

.platform--mist .platform-eyebrow { color: var(--color-midnight-2); }

.platform-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-subtle);
}

.platform-pill__dot {
  width: 6px; height: 6px; border-radius: 50%;
  display: inline-block;
}

.platform-pill--live {
  background: var(--status-active-bg);
  color: var(--status-active);
  border-color: color-mix(in srgb, var(--status-active) 35%, transparent);
}
.platform-pill--live .platform-pill__dot { background: var(--status-active); }

.platform-pill--soon {
  background: var(--surface-tag-major-feature);
  color: var(--orange-700);
  border-color: color-mix(in srgb, var(--color-orange) 30%, transparent);
}
.platform-pill--soon .platform-pill__dot {
  background: var(--color-orange);
  animation: soonBlink 1.4s ease-in-out infinite;
}
@keyframes soonBlink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.25; }
}

.platform-title {
  font-family: var(--brand-typography--title);
  font-size: var(--brand-typography-size--heading-h5);
  font-weight: 300;
  letter-spacing: var(--tracking-tight);
  line-height: 1.15;
  color: var(--text-primary);
}

.platform-analogy {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--text-muted);
  line-height: 1.5;
}

.platform-desc {
  font-size: var(--brand-typography-size--body-m);
  color: var(--text-secondary);
  line-height: 1.6;
}

.platform-art {
  background: var(--neutral-100);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-4);
  display: flex;
  justify-content: center;
  align-items: center;
}
.platform-art svg { width: 100%; max-width: 240px; height: auto; }

.platform-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: auto;
  padding-top: var(--space-3);
  border-top: 1px dashed var(--border-subtle);
}

.platform-meta {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.platform-meta__count {
  font-family: var(--font-mono);
  font-size: var(--text-xl);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--platform-accent);
}
.platform--mist .platform-meta__count { color: var(--color-midnight-2); }

.platform-meta__label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.platform-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-near-black);
  white-space: nowrap;
  transition: gap var(--duration-md) var(--ease-out);
}

.platform:hover .platform-cta { gap: 10px; }
.platform:hover .platform-cta .fa-arrow-right { transform: translateX(2px); }

.platform-cta .fa-arrow-right {
  transition: transform var(--duration-md) var(--ease-out);
}

.platform--soon .platform-art { filter: saturate(0.85); }

/* ─────────────────────────────────────────────────────────────────
   How it works — three steps
   ───────────────────────────────────────────────────────────────── */
.howitworks {
  background: var(--neutral-100);
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  padding: clamp(var(--space-10), 7vw, var(--space-12)) 0;
}

.steps {
  list-style: none;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
}

@media (max-width: 880px) {
  .steps { grid-template-columns: 1fr; }
  .step-connector { display: none; }
}

.step {
  position: relative;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-6);
}

.step-no {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: var(--tracking-widest);
  color: var(--color-orange);
  margin-bottom: var(--space-3);
}

.step-title {
  font-family: var(--brand-typography--title);
  font-size: var(--brand-typography-size--heading-h6);
  font-weight: 300;
  letter-spacing: var(--tracking-tight);
  margin-bottom: var(--space-2);
  color: var(--text-primary);
}

.step-desc {
  font-size: var(--brand-typography-size--body-m);
  color: var(--text-secondary);
  line-height: 1.65;
}

.step-connector {
  position: absolute;
  top: 50%;
  left: -36px;
  width: 60px;
  height: 20px;
  transform: translateY(-50%);
  z-index: 1;
}

/* ─────────────────────────────────────────────────────────────────
   Final CTA
   ───────────────────────────────────────────────────────────────── */
.final-cta {
  background: var(--color-midnight);
  color: var(--text-inverse);
  padding: clamp(var(--space-10), 7vw, var(--space-12)) var(--space-6);
}

.final-cta__inner {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: var(--space-8);
  align-items: center;
}

@media (max-width: 760px) {
  .final-cta__inner { grid-template-columns: 1fr; }
  .final-cta__actions { justify-content: flex-start; }
}

.final-cta__title {
  font-family: var(--brand-typography--title);
  font-size: clamp(1.8rem, 4vw, var(--brand-typography-size--heading-h4));
  font-weight: 300;
  letter-spacing: var(--tracking-tight);
  line-height: 1.15;
  margin: var(--space-3) 0 var(--space-4);
  color: var(--text-inverse);
}

.final-cta__sub {
  color: var(--text-on-dark-body);
  line-height: 1.65;
  max-width: 56ch;
}

.final-cta__actions {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  justify-content: flex-end;
}

.final-cta__about,
.final-cta__about:hover,
.final-cta__about:visited {
  color: var(--text-inverse);
  border-color: var(--border-on-dark-default);
  background: transparent;
}
.final-cta__about:hover {
  background: var(--surface-on-dark-faint);
  border-color: var(--border-on-dark-stronger);
}

/* ─────────────────────────────────────────────────────────────────
   Mobile tweaks
   ───────────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .board-row {
    grid-template-columns: auto 70px 1fr;
  }
  .board-row__code  { grid-column: 1; }
  .board-row__digits { grid-column: 2; }
  .board-row__label  { grid-column: 3; }
  .board-row__dot, .board-row__dest { display: none; }

  .platform-rail__num { font-size: var(--brand-typography-size--heading-h6); }
  .platform-rail { flex-basis: 64px; }
  .platform-body { padding: var(--space-4) var(--space-4); }
}
</style>
