<script setup lang="ts">
import { ref } from 'vue'

interface SkillEntry {
  id: string
  status: 'published' | 'planned'
  name: string
  version: string
  tagline: string
  triggers: string[]
  recommends: string[]
}

const skills: SkillEntry[] = [
  {
    id: 'sklearn-expert',
    status: 'published',
    name: 'sklearn-expert',
    version: '0.1.0',
    tagline:
      'Opinionated machine-learning advice. Defaults to the scikit-learn ecosystem stack — no framework-agnostic hedging.',
    triggers: [
      'scikit-learn pipelines',
      'tabular data preparation',
      'model selection & cross-validation',
      'fraud detection · churn · pricing',
      'feature engineering · preprocessing',
    ],
    recommends: ['scikit-learn', 'skrub', 'skore'],
  },
  {
    id: 'sklearn-deploy',
    status: 'planned',
    name: 'sklearn-deploy',
    version: '—',
    tagline:
      'Take a trained pipeline to production: serialization, calibration, monitoring, versioning. (Planned route.)',
    triggers: ['skops', 'CalibratedClassifierCV', 'inference servers'],
    recommends: [],
  },
]

interface Stop {
  time: string
  title: string
  detail: string
  tone: 'sky' | 'orange' | 'mist' | 'violet'
  code: string
}

const stops: Stop[] = [
  {
    time: '09:15',
    title: 'Prepare',
    tone: 'sky',
    detail:
      'Let skrub handle the messy parts: mixed types, NaN, dirty strings, dates — one call.',
    code: `from skrub import TableVectorizer
prep = TableVectorizer()`,
  },
  {
    time: '10:40',
    title: 'Model',
    tone: 'orange',
    detail:
      'Build a leak-proof Pipeline. Default to HistGradientBoosting — handles NaN, fast, strong baseline.',
    code: `from sklearn.pipeline import make_pipeline
from sklearn.ensemble import HistGradientBoostingClassifier

pipe = make_pipeline(prep, HistGradientBoostingClassifier())`,
  },
  {
    time: '12:05',
    title: 'Evaluate',
    tone: 'violet',
    detail:
      'Use skore cross_validate for rich tracking. Pick PR-AUC on imbalanced data, not accuracy.',
    code: `import skore
project = skore.Project("experiment")
from skore import cross_validate

results = cross_validate(
    pipe, X, y, cv=5,
    scoring=["roc_auc", "average_precision"],
    project=project,
)`,
  },
  {
    time: '14:32',
    title: 'Compare',
    tone: 'mist',
    detail:
      'Side-by-side reports for each candidate. Pick a model with eyes open, not a single score.',
    code: `from skore import EstimatorReport, ComparisonReport

r1 = EstimatorReport(pipe, X_train=X_tr, X_test=X_te, y_train=y_tr, y_test=y_te)
# r2 = ...
ComparisonReport([r1, r2])`,
  },
]

// ── Copy ──────────────────────────────────────────────────────
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
    /* clipboard rejected — snippet is selectable */
  }
}

const installSnippet = `# 1. Clone or download the skill
git clone https://github.com/probabl-ai/scikit-learn-central

# 2. Copy it to your project (or to ~/.claude/skills for global)
mkdir -p .claude/skills
cp -r scikit-learn-central/skills/sklearn-expert .claude/skills/

# 3. Reload Claude Code — the skill auto-triggers on relevant prompts.`

const frontmatter = `---
name: sklearn-expert
description: >
  Trigger when the user asks about ML with Python,
  scikit-learn, skrub, skore, tabular pipelines,
  model selection, cross-validation, feature engineering...
version: 0.1.0
---`

const bodyPreview = `# scikit-learn Ecosystem Expert

Respond as a machine learning professional fully versed
in scikit-learn, skrub, and skore. Give opinionated,
concrete advice. Recommend the sklearn ecosystem stack
by default. Avoid framework-agnostic hedging — tell the
user what to do and why.

## The 3-Library Stack
  · scikit-learn — the modeling core
  · skrub        — dirty tabular data preparation
  · skore        — experiment tracking & rich evaluation

## The Canonical Workflow
  1. PREPARE   → skrub.TableVectorizer
  2. MODEL     → make_pipeline + HistGradientBoosting…
  3. EVALUATE  → skore.cross_validate
  4. COMPARE   → skore.ComparisonReport`
</script>

<template>
  <div id="view-skills" class="view skills-view" role="tabpanel" aria-label="Skills">
    <div class="page-content sk-page">
      <!-- ── Hero ─────────────────────────────────────────────── -->
      <section class="sk-hero">
        <div class="sk-hero__bg" aria-hidden="true">
          <svg class="sk-hero__map" viewBox="0 0 800 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="skRoute" x1="0" x2="1">
                <stop offset="0"   stop-color="#7C3AED" stop-opacity="0" />
                <stop offset="0.3" stop-color="#7C3AED" stop-opacity="0.6" />
                <stop offset="0.7" stop-color="#4CD0FF" stop-opacity="0.6" />
                <stop offset="1"   stop-color="#4CD0FF" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M 0 120 C 100 100, 180 60, 280 80 S 460 160, 560 120 S 740 60, 800 100"
              stroke="url(#skRoute)"
              stroke-width="2"
              fill="none"
              stroke-dasharray="4 6"
            />
            <path
              d="M 0 80 C 120 60, 200 140, 320 130 S 480 60, 600 90 S 760 140, 800 130"
              stroke="url(#skRoute)"
              stroke-width="2"
              fill="none"
              stroke-dasharray="4 6"
            />
            <g fill="#FF7900">
              <circle cx="100" cy="105" r="3" />
              <circle cx="280" cy="80"  r="3" />
              <circle cx="460" cy="118" r="3" />
              <circle cx="640" cy="100" r="3" />
            </g>
          </svg>
        </div>

        <div class="sk-hero__inner">
          <div class="sk-hero__corner-tag">Platform 03</div>
          <div class="sk-hero__eyebrow">
            <span class="spark"></span>
            Timetables · Skill files for your agent
          </div>
          <h1 class="sk-hero__title">
            Readable timetables that teach your agent the routes.
          </h1>
          <p class="sk-hero__lede">
            A skill is a single Markdown file. Front-matter tells your AI
            assistant <em>when</em> to call on the skill; the body tells it
            <em>how</em> to think about the problem. No engines required — just
            a route map.
          </p>

          <div class="sk-hero__stats">
            <div class="stat-card">
              <span class="stat-card__num">{{ skills.filter((s) => s.status === 'published').length }}</span>
              <span class="stat-card__label">Published</span>
            </div>
            <div class="stat-card stat-card--soft">
              <span class="stat-card__num">{{ skills.filter((s) => s.status === 'planned').length }}</span>
              <span class="stat-card__label">Planned</span>
            </div>
            <div class="stat-card stat-card--soft">
              <span class="stat-card__num">3</span>
              <span class="stat-card__label">Libraries covered</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Skill catalog ────────────────────────────────────── -->
      <section class="sk-section">
        <div class="sk-section__head">
          <span class="eyebrow"><span class="spark"></span>Today's timetables</span>
          <h2 class="sk-section__title">Pick a skill to board.</h2>
        </div>

        <ul class="skill-grid">
          <li
            v-for="(s, i) in skills"
            :key="s.id"
            class="skill-card"
            :class="`skill-card--${s.status}`"
          >
            <div class="skill-card__lane" aria-hidden="true">
              <span class="skill-card__num">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="skill-card__lane-label">SK · {{ s.id }}</span>
            </div>

            <div class="skill-card__main">
              <div class="skill-card__head">
                <h3 class="skill-card__name">{{ s.name }}</h3>
                <span class="skill-card__ver">v{{ s.version }}</span>
                <span
                  class="skill-card__pill"
                  :class="`skill-card__pill--${s.status}`"
                >
                  <span class="skill-card__pill-dot"></span>
                  {{ s.status === 'published' ? 'Published' : 'Planned' }}
                </span>
              </div>

              <p class="skill-card__tag">{{ s.tagline }}</p>

              <div class="skill-card__row">
                <span class="skill-card__row-label">Triggers on</span>
                <ul class="skill-card__chips">
                  <li v-for="t in s.triggers" :key="t">{{ t }}</li>
                </ul>
              </div>

              <div v-if="s.recommends.length" class="skill-card__row">
                <span class="skill-card__row-label">Recommends</span>
                <ul class="skill-card__chips skill-card__chips--accent">
                  <li v-for="r in s.recommends" :key="r">{{ r }}</li>
                </ul>
              </div>

              <div v-if="s.status === 'planned'" class="skill-card__soon">
                <i class="fas fa-hard-hat" aria-hidden="true"></i>
                Track under construction
              </div>
            </div>
          </li>
        </ul>
      </section>

      <!-- ── Anatomy ─────────────────────────────────────────── -->
      <section class="sk-section sk-section--alt">
        <div class="sk-section__head">
          <span class="eyebrow"><span class="spark"></span>Anatomy of a skill</span>
          <h2 class="sk-section__title">Two halves: a sign on the platform, and the timetable itself.</h2>
        </div>

        <div class="anatomy">
          <div class="anatomy__pane">
            <div class="anatomy__head">
              <span class="anatomy__chip anatomy__chip--orange">Front-matter</span>
              <span class="anatomy__filename">SKILL.md</span>
            </div>
            <p class="anatomy__caption">
              The <strong>sign on the platform</strong>. Tells your agent
              exactly when this timetable applies.
            </p>
            <pre class="anatomy__code"><code>{{ frontmatter }}</code></pre>
          </div>

          <div class="anatomy__pane">
            <div class="anatomy__head">
              <span class="anatomy__chip anatomy__chip--sky">Body</span>
              <span class="anatomy__filename">SKILL.md</span>
            </div>
            <p class="anatomy__caption">
              The <strong>timetable itself</strong>. Stack overview, canonical
              workflow, decision tables, common mistakes.
            </p>
            <pre class="anatomy__code"><code>{{ bodyPreview }}</code></pre>
          </div>
        </div>
      </section>

      <!-- ── Canonical journey ───────────────────────────────── -->
      <section class="sk-section">
        <div class="sk-section__head">
          <span class="eyebrow"><span class="spark"></span>A sample journey</span>
          <h2 class="sk-section__title">The canonical timetable, four stops.</h2>
          <p class="sk-section__lede">
            One ride from raw data to model comparison. Every stop is what the
            <code>sklearn-expert</code> skill will recommend by default.
          </p>
        </div>

        <ol class="journey">
          <li v-for="(s, i) in stops" :key="s.title" class="journey-stop" :class="`tone--${s.tone}`">
            <div class="journey-stop__time">
              <span class="journey-stop__time-num">{{ s.time }}</span>
              <span class="journey-stop__time-label">PLATFORM {{ String(i + 1).padStart(2, '0') }}</span>
            </div>

            <div class="journey-stop__body">
              <h3 class="journey-stop__title">
                <span class="journey-stop__dot" aria-hidden="true"></span>
                {{ s.title }}
              </h3>
              <p class="journey-stop__detail">{{ s.detail }}</p>
              <pre class="journey-stop__code"><code>{{ s.code }}</code></pre>
            </div>

            <div v-if="i < stops.length - 1" class="journey-stop__line" aria-hidden="true"></div>
          </li>
        </ol>
      </section>

      <!-- ── Install ─────────────────────────────────────────── -->
      <section class="sk-section sk-section--dark">
        <div class="sk-section__head">
          <span class="eyebrow eyebrow--dark"><span class="spark"></span>Board this skill</span>
          <h2 class="sk-section__title sk-section__title--dark">
            Drop it into Claude Code in three lines.
          </h2>
        </div>

        <div class="install-card">
          <div class="install-card__head">
            <span class="install-card__dot install-card__dot--r"></span>
            <span class="install-card__dot install-card__dot--y"></span>
            <span class="install-card__dot install-card__dot--g"></span>
            <span class="install-card__title">terminal — install sklearn-expert</span>
            <button
              type="button"
              class="install-card__copy"
              :class="{ 'is-copied': copied === 'install' }"
              @click="copy(installSnippet, 'install')"
            >
              <i class="fas" :class="copied === 'install' ? 'fa-check' : 'fa-copy'"></i>
              {{ copied === 'install' ? 'Copied' : 'Copy' }}
            </button>
          </div>
          <pre class="install-card__code"><code>{{ installSnippet }}</code></pre>
        </div>
      </section>

      <!-- ── Footer ──────────────────────────────────────────── -->
      <section class="sk-foot">
        <div class="sk-foot__copy">
          <h2 class="sk-foot__title">Want to author a new timetable?</h2>
          <p class="sk-foot__sub">
            Each skill is a single <code>SKILL.md</code> file. Open a PR with
            a new route — fraud detection, time-series, deployment — anything
            that completes a real journey.
          </p>
        </div>
        <div class="sk-foot__actions">
          <a
            href="https://github.com/probabl-ai/scikit-learn-central/tree/main/skills"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn--primary"
          >
            <i class="fab fa-github" aria-hidden="true"></i>
            Read existing skills
          </a>
          <router-link to="/mcp" class="btn btn--outline">
            <i class="fas fa-tower-broadcast" aria-hidden="true"></i>
            Visit the dispatch
          </router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.skills-view {
  background: var(--bg-page);
  min-width: 0;
}

.sk-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  padding-bottom: var(--space-12);
}

.spark {
  display: inline-block;
  width: 22px; height: 14px;
  background: url('/images/spark.svg') center/contain no-repeat;
  flex-shrink: 0;
}

.eyebrow.eyebrow--dark { color: var(--color-sky); }

/* ─────────────────────────────────────────────────────────────────
   Hero
   ───────────────────────────────────────────────────────────────── */
.sk-hero {
  position: relative;
  background: var(--color-midnight);
  color: var(--text-inverse);
  border: 1px solid var(--color-midnight-line);
  border-radius: var(--radius-md);
  padding: clamp(var(--space-8), 6vw, var(--space-12));
  overflow: hidden;
  isolation: isolate;
}

.sk-hero__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.65;
}
.sk-hero__map { width: 100%; height: 100%; }

.sk-hero__inner {
  position: relative;
  z-index: 1;
  max-width: 760px;
}

.sk-hero__corner-tag {
  position: absolute;
  top: 0; right: 0;
  background: #7C3AED;
  color: var(--text-inverse);
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  padding: 6px 14px;
  white-space: nowrap;
  transform: translate(clamp(0px, 4vw, 24px), -50%);
}

.sk-hero__eyebrow {
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

.sk-hero__title {
  font-family: var(--brand-typography--title);
  font-size: clamp(2rem, 4.6vw, var(--brand-typography-size--heading-h2));
  font-weight: 300;
  letter-spacing: var(--tracking-display);
  line-height: 1.1;
  margin: var(--space-4) 0 var(--space-5);
  color: var(--text-inverse);
  max-width: 22ch;
}

.sk-hero__lede {
  font-size: var(--brand-typography-size--body-l);
  line-height: 1.65;
  color: var(--text-on-dark-body);
  max-width: 60ch;
}
.sk-hero__lede em { color: var(--color-sky); font-style: italic; }

.sk-hero__stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.stat-card {
  background: var(--surface-on-dark-faint);
  border: 1px solid var(--border-on-dark-hairline);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-5);
  min-width: 130px;
}
.stat-card--soft { background: transparent; }

.stat-card__num {
  display: block;
  font-family: var(--brand-typography--title);
  font-size: var(--brand-typography-size--heading-h4);
  font-weight: 300;
  letter-spacing: var(--tracking-tight);
  color: var(--color-sky);
  line-height: 1;
}
.stat-card--soft .stat-card__num { color: var(--text-on-dark-secondary); }

.stat-card__label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--text-on-dark-secondary);
  display: block;
  margin-top: 4px;
}

/* ─────────────────────────────────────────────────────────────────
   Sections
   ───────────────────────────────────────────────────────────────── */
.sk-section { padding: var(--space-6) 0; }
.sk-section--alt {
  background: var(--neutral-100);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: clamp(var(--space-8), 5vw, var(--space-10)) clamp(var(--space-5), 4vw, var(--space-8));
}
.sk-section--dark {
  background: var(--color-midnight);
  border-radius: var(--radius-md);
  padding: clamp(var(--space-8), 5vw, var(--space-10)) clamp(var(--space-5), 4vw, var(--space-8));
  color: var(--text-inverse);
}

.sk-section__head {
  max-width: 640px;
  margin: 0 auto var(--space-7);
  text-align: center;
}
.sk-section__title {
  font-family: var(--brand-typography--title);
  font-size: clamp(1.7rem, 3vw, var(--brand-typography-size--heading-h4));
  font-weight: 300;
  letter-spacing: var(--tracking-tight);
  line-height: 1.2;
  margin: var(--space-3) 0 var(--space-3);
  color: var(--text-primary);
}
.sk-section__title--dark { color: var(--text-inverse); }
.sk-section__lede {
  font-size: var(--brand-typography-size--body-l);
  line-height: 1.6;
  color: var(--text-muted);
}
.sk-section__lede code {
  font-family: var(--font-mono);
  background: var(--neutral-100);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 0.9em;
}

/* ─────────────────────────────────────────────────────────────────
   Skill grid
   ───────────────────────────────────────────────────────────────── */
.skill-grid {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5);
}
@media (max-width: 760px) {
  .skill-grid { grid-template-columns: 1fr; }
}

.skill-card {
  display: flex;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: transform var(--duration-md) var(--ease-out),
              border-color var(--duration-md) var(--ease-out),
              box-shadow var(--duration-md) var(--ease-out);
}
.skill-card:hover {
  transform: translateY(-3px);
  border-color: var(--color-near-black);
  box-shadow: var(--shadow-md);
}
.skill-card--planned { opacity: 0.95; }
.skill-card--planned .skill-card__lane { background: var(--neutral-700); }

.skill-card__lane {
  flex: 0 0 72px;
  background: #7C3AED;
  color: var(--text-inverse);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-2);
  gap: var(--space-2);
}

.skill-card__num {
  font-family: var(--brand-typography--title);
  font-size: var(--brand-typography-size--heading-h5);
  font-weight: 300;
  letter-spacing: var(--tracking-tight);
  line-height: 1;
}

.skill-card__lane-label {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--text-on-dark-secondary);
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

.skill-card__main {
  flex: 1;
  padding: var(--space-5) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
}

.skill-card__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.skill-card__name {
  font-family: var(--font-mono);
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--text-primary);
}

.skill-card__ver {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
  letter-spacing: var(--tracking-wide);
}

.skill-card__pill {
  margin-left: auto;
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

.skill-card__pill-dot {
  width: 6px; height: 6px; border-radius: 50%;
}

.skill-card__pill--published {
  background: var(--status-active-bg);
  color: var(--status-active);
  border-color: color-mix(in srgb, var(--status-active) 35%, transparent);
}
.skill-card__pill--published .skill-card__pill-dot { background: var(--status-active); }

.skill-card__pill--planned {
  background: var(--surface-tag-major-feature);
  color: var(--orange-700);
  border-color: color-mix(in srgb, var(--color-orange) 30%, transparent);
}
.skill-card__pill--planned .skill-card__pill-dot {
  background: var(--color-orange);
  animation: dotBlink 1.4s ease-in-out infinite;
}
@keyframes dotBlink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.25; }
}

.skill-card__tag {
  font-size: var(--brand-typography-size--body-m);
  color: var(--text-secondary);
  line-height: 1.6;
}

.skill-card__row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skill-card__row-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--text-muted);
}

.skill-card__chips {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.skill-card__chips li {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: var(--tracking-wide);
  background: var(--neutral-100);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.skill-card__chips--accent li {
  background: var(--surface-sky-on-dark-soft);
  border-color: color-mix(in srgb, var(--color-sky) 30%, transparent);
  color: #0a6fa0;
}

.skill-card__soon {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--orange-700);
  margin-top: auto;
}

/* ─────────────────────────────────────────────────────────────────
   Anatomy
   ───────────────────────────────────────────────────────────────── */
.anatomy {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5);
}
@media (max-width: 880px) {
  .anatomy { grid-template-columns: 1fr; }
}

.anatomy__pane {
  background: var(--color-near-black);
  border: 1px solid var(--border-on-dark-default);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.anatomy__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-on-dark-hairline);
  background: rgb(255 255 255 / 0.03);
}

.anatomy__chip {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: var(--tracking-widest);
  padding: 3px 8px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
}
.anatomy__chip--orange {
  background: var(--surface-orange-on-dark-soft);
  color: var(--color-orange);
  border: 1px solid color-mix(in srgb, var(--color-orange) 35%, transparent);
}
.anatomy__chip--sky {
  background: var(--surface-sky-on-dark-soft);
  color: var(--color-sky);
  border: 1px solid var(--border-sky-on-dark-soft);
}

.anatomy__filename {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-on-dark-secondary);
}

.anatomy__caption {
  padding: var(--space-3) var(--space-5) 0;
  color: var(--text-on-dark-body);
  font-size: var(--text-sm);
  line-height: 1.6;
}
.anatomy__caption strong { color: var(--text-inverse); }

.anatomy__code {
  margin: 0;
  padding: var(--space-4) var(--space-5);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--color-sky);
  white-space: pre;
  overflow-x: auto;
  flex: 1;
}

/* ─────────────────────────────────────────────────────────────────
   Journey (4 stops)
   ───────────────────────────────────────────────────────────────── */
.journey {
  list-style: none;
  max-width: 880px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.journey-stop {
  position: relative;
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: var(--space-5);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-5) var(--space-6);
}
@media (max-width: 720px) {
  .journey-stop { grid-template-columns: 1fr; }
}

.tone--sky    { --stop-accent: var(--color-sky); }
.tone--orange { --stop-accent: var(--color-orange); }
.tone--violet { --stop-accent: #7C3AED; }
.tone--mist   { --stop-accent: var(--color-graphite); }

.journey-stop::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--stop-accent);
  border-radius: var(--radius-md) 0 0 var(--radius-md);
}

.journey-stop__time {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: var(--space-3);
}

.journey-stop__time-num {
  font-family: var(--font-mono);
  font-size: var(--brand-typography-size--heading-h5);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--stop-accent);
  line-height: 1;
}

.journey-stop__time-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--text-muted);
}

.journey-stop__body { min-width: 0; }

.journey-stop__title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--brand-typography--title);
  font-size: var(--brand-typography-size--heading-h6);
  font-weight: 300;
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.journey-stop__dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--stop-accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--stop-accent) 18%, transparent);
}

.journey-stop__detail {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: var(--space-3);
}

.journey-stop__code {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  background: var(--color-near-black);
  color: var(--color-sky);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: 1.6;
  border-radius: var(--radius-sm);
  overflow-x: auto;
  white-space: pre;
}

/* ─────────────────────────────────────────────────────────────────
   Install card (terminal-style)
   ───────────────────────────────────────────────────────────────── */
.install-card {
  background: var(--color-near-black);
  border: 1px solid var(--border-on-dark-default);
  border-radius: var(--radius-md);
  overflow: hidden;
  max-width: 760px;
  margin: 0 auto;
}

.install-card__head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px var(--space-4);
  background: rgb(255 255 255 / 0.04);
  border-bottom: 1px solid var(--border-on-dark-hairline);
}

.install-card__dot {
  width: 10px; height: 10px; border-radius: 50%;
  display: inline-block;
}
.install-card__dot--r { background: #ff5f57; }
.install-card__dot--y { background: #ffbd2e; }
.install-card__dot--g { background: #28c940; }

.install-card__title {
  margin-left: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-on-dark-secondary);
  letter-spacing: var(--tracking-wide);
}

.install-card__copy {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid var(--border-on-dark-default);
  color: var(--text-inverse);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: background var(--duration-md) var(--ease-out),
              transform var(--duration-press) var(--ease-out);
}
.install-card__copy:hover { background: var(--surface-on-dark-faint); }
.install-card__copy:active { transform: scale(0.97); }
.install-card__copy.is-copied { color: var(--color-sky); border-color: var(--border-sky-on-dark-soft); }

.install-card__code {
  margin: 0;
  padding: var(--space-5) var(--space-6);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-sky);
  white-space: pre;
  overflow-x: auto;
  line-height: 1.7;
}

/* ─────────────────────────────────────────────────────────────────
   Footer CTA
   ───────────────────────────────────────────────────────────────── */
.sk-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-6) clamp(var(--space-5), 4vw, var(--space-8));
  flex-wrap: wrap;
}
.sk-foot__title {
  font-family: var(--brand-typography--title);
  font-size: var(--brand-typography-size--heading-h6);
  font-weight: 300;
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}
.sk-foot__sub {
  margin-top: var(--space-2);
  color: var(--text-muted);
  max-width: 60ch;
}
.sk-foot__sub code {
  font-family: var(--font-mono);
  background: var(--neutral-100);
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}
.sk-foot__actions {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}
</style>
