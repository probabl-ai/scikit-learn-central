<script setup lang="ts">
/**
 * PackageInsightCard — re-design of the package card guided by Nadi & Sakr
 * (EMSE 2022) "Selecting Third-party Libraries: The Data Scientist's
 * Perspective". The card prioritises the seven signals data scientists rate
 * highest:
 *
 *   1. Usability             → compatibility row (provides/consumes estimators)
 *   2. Documentation         → Docs link (when present)
 *   3. Fit for purpose       → "Best for" task hints + concrete use-case titles
 *   4. Community activeness  → "Updated X ago" + latest release
 *   5. Maturity & stability  → latest release + age
 *   6. Performance           → tag if present (limited by current data)
 *   7. Community experience  → stars · forks (proxy for contributor base)
 *
 * Concrete use cases that exercise this package are listed by title (per the
 * paper: fit-for-purpose is task-level, not API-level). This converts the
 * previous "3 use cases" count into something the user can actually evaluate.
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Package } from '@/types/package'
import type { UseCase } from '@/types/usecase'
import { fmt } from '@/utils/format'
import { relativeTime } from '@/utils/relativeTime'

const props = defineProps<{
  pkg: Package
  useCases: UseCase[]
  showFitChip: boolean
  isProbablBoosted: boolean
}>()

const router = useRouter()

const natureClass: Record<string, string> = {
  library: 'badge--library',
  extension: 'badge--extension',
  application: 'badge--application',
}
const scopeClass: Record<string, string> = {
  core: 'badge--core',
  incremental: 'badge--incremental',
  verticalized: 'badge--verticalized',
}

/* ── Fit-for-purpose summary (task-level) ──────────────────
   Render up to four tags as a "Best for" line. Tags like "dirty-data"
   read as "dirty data" — the paper's whole point is that DS need
   task-level intent, not API names. */
const bestFor = computed(() =>
  (props.pkg.tags ?? []).slice(0, 4).map((t) => t.replace(/-/g, ' ')),
)

/* ── Activity & maturity ───────────────────────────────────
   Last-commit and latest-release dates speak directly to the paper's
   "activeness" and "maturity & stability" factors. */
const lastCommitRel = computed(() =>
  relativeTime(props.pkg.stats?.github?.last_commit),
)
const releaseDate = computed(
  () =>
    props.pkg.stats?.github?.latest_release_date ??
    props.pkg.stats?.pypi?.release_date,
)
const releaseRel = computed(() => relativeTime(releaseDate.value))

/* ── Community experience proxy ────────────────────────────
   We don't have a contributors_count per package in stats.json. Forks
   are a reasonable stand-in: a project with many forks has a larger
   pool of contributors and people who care enough to copy the repo. */
const forks = computed(() => props.pkg.stats?.github?.forks)

/* ── Concrete use cases ────────────────────────────────────
   The paper's strongest recommendation: surface task-level fit. We list
   real use-case titles (not just a count) and link to /use-cases. */
const visibleUseCases = computed(() => props.useCases.slice(0, 3))
const extraUseCases = computed(() =>
  Math.max(0, props.useCases.length - visibleUseCases.value.length),
)

function openUseCase(uc: UseCase): void {
  router.push({ path: '/use-cases', query: { slug: uc.slug } })
}

/* ── Pip install copy ──────────────────────────────────────*/
const copied = ref(false)
async function copyInstall(): Promise<void> {
  if (!props.pkg.pypi_name) return
  try {
    await navigator.clipboard.writeText(`pip install ${props.pkg.pypi_name}`)
    copied.value = true
    setTimeout(() => (copied.value = false), 1200)
  } catch {
    /* clipboard unavailable */
  }
}

/* ── Fit-score chip — six deterministic axes weighted per Nadi & Sakr 2022.
   Each sub-score is 0–100; the chip shows the weighted fitBase. */
const fitDisplay = computed(() => Math.round(props.pkg.fitBase))
const fitnessScore = computed(() => Math.round(props.pkg.fitFitness))
const activityScore = computed(() => Math.round(props.pkg.fitActivity))
const communityScore = computed(() => Math.round(props.pkg.fitCommunity))
const adoptionScore = computed(() => Math.round(props.pkg.fitAdoption))
const docsScore = computed(() => Math.round(props.pkg.fitDocs))
const testingScore = computed(() => Math.round(props.pkg.fitTesting))
</script>

<template>
  <article class="insight-card" :data-id="pkg.id">
    <!-- ── Fit-score chip — kept from previous design ── -->
    <div
      v-if="showFitChip"
      class="card__ranking"
      :class="{ 'card__ranking--probabl': isProbablBoosted }"
    >
      <template v-if="isProbablBoosted">
        <svg width="20" height="20" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Featured by Probabl">
          <circle cx="200" cy="200" r="200" fill="#1E22AA" />
          <path d="M110.452 145.278H141.492C144.142 145.278 145.278 144.142 145.278 141.493V110.452C145.278 107.803 144.142 106.667 141.492 106.667H110.452C107.802 106.667 106.667 107.803 106.667 110.452V141.493C106.667 144.142 107.802 145.278 110.452 145.278Z" fill="#F68D2E" />
          <path d="M110.452 292.001H141.492C144.142 292.001 145.278 290.865 145.278 288.215V257.175C145.278 254.525 144.142 253.39 141.492 253.39H110.452C107.802 253.39 106.667 254.525 106.667 257.175V288.215C106.667 290.865 107.802 292.001 110.452 292.001Z" fill="#F68D2E" />
          <path d="M257.174 292.001H288.214C290.864 292.001 292 290.865 292 288.215V257.175C292 254.525 290.864 253.39 288.214 253.39H257.174C254.524 253.39 253.389 254.525 253.389 257.175V288.215C253.389 290.865 254.524 292.001 257.174 292.001Z" fill="#F68D2E" />
        </svg>
      </template>
      <template v-else>{{ fitDisplay }}</template>
      <div class="ranking-tooltip" :class="{ 'ranking-tooltip--probabl': isProbablBoosted }">
        <template v-if="isProbablBoosted">
          <div class="ranking-tooltip__title">Featured by :probabl.</div>
          <p class="ranking-tooltip__probabl-body">
            A core project of Probabl, the company behind scikit-learn. Editorially pinned at the top of the Fit Score ranking.
          </p>
          <div class="ranking-tooltip__divider"></div>
        </template>
        <div class="ranking-tooltip__title">Fit Score</div>
        <div class="ranking-tooltip__row">
          <span class="ranking-tooltip__label"><i class="fas fa-lightbulb"></i> Fitness</span>
          <div class="ranking-tooltip__track"><div class="ranking-tooltip__fill" :style="{ width: fitnessScore + '%' }"></div></div>
          <span class="ranking-tooltip__val">{{ fitnessScore }}</span>
        </div>
        <div class="ranking-tooltip__row">
          <span class="ranking-tooltip__label"><i class="fas fa-bolt"></i> Activity</span>
          <div class="ranking-tooltip__track"><div class="ranking-tooltip__fill" :style="{ width: activityScore + '%' }"></div></div>
          <span class="ranking-tooltip__val">{{ activityScore }}</span>
        </div>
        <div class="ranking-tooltip__row">
          <span class="ranking-tooltip__label"><i class="fas fa-code-branch"></i> Community</span>
          <div class="ranking-tooltip__track"><div class="ranking-tooltip__fill" :style="{ width: communityScore + '%' }"></div></div>
          <span class="ranking-tooltip__val">{{ communityScore }}</span>
        </div>
        <div class="ranking-tooltip__row">
          <span class="ranking-tooltip__label"><i class="fas fa-download"></i> Adoption</span>
          <div class="ranking-tooltip__track"><div class="ranking-tooltip__fill" :style="{ width: adoptionScore + '%' }"></div></div>
          <span class="ranking-tooltip__val">{{ adoptionScore }}</span>
        </div>
        <div class="ranking-tooltip__row">
          <span class="ranking-tooltip__label"><i class="fas fa-book"></i> Docs</span>
          <div class="ranking-tooltip__track"><div class="ranking-tooltip__fill" :style="{ width: docsScore + '%' }"></div></div>
          <span class="ranking-tooltip__val">{{ docsScore }}</span>
        </div>
        <div class="ranking-tooltip__row">
          <span class="ranking-tooltip__label"><i class="fas fa-flask"></i> Testing</span>
          <div class="ranking-tooltip__track"><div class="ranking-tooltip__fill" :style="{ width: testingScore + '%' }"></div></div>
          <span class="ranking-tooltip__val">{{ testingScore }}</span>
        </div>
      </div>
    </div>

    <!-- ── Header: name + meta strip ── -->
    <header class="insight-card__head">
      <h3 class="insight-card__name">{{ pkg.name }}</h3>
      <div class="insight-card__meta">
        <span class="badge" :class="natureClass[pkg.nature]">{{ pkg.nature }}</span>
        <span class="badge" :class="scopeClass[pkg.scope]">{{ pkg.scope }}</span>
        <span class="badge badge--license">{{ pkg.license }}</span>
        <span v-if="pkg.version" class="badge badge--version">v{{ pkg.version }}</span>
      </div>
    </header>

    <p class="insight-card__description">{{ pkg.description }}</p>

    <!-- ── Fit for purpose (task-level) ── -->
    <section v-if="bestFor.length" class="insight-card__section">
      <div class="insight-card__label">Best for</div>
      <div class="insight-card__tags">
        <span v-for="t in bestFor" :key="t" class="task-chip">{{ t }}</span>
      </div>
    </section>

    <!-- ── Compatibility (sklearn pipeline interop) ── -->
    <section class="insight-card__compat">
      <span
        class="compat-pill"
        :class="pkg.provides_estimators ? 'compat-pill--yes' : 'compat-pill--no'"
        title="Defines sklearn-compatible estimators (fit / predict / transform)"
      >
        {{ pkg.provides_estimators ? '✓' : '✗' }} Provides estimators
      </span>
      <span
        class="compat-pill"
        :class="pkg.consumes_estimators ? 'compat-pill--yes' : 'compat-pill--no'"
        title="Accepts sklearn estimators as input (wrappers, meta-estimators)"
      >
        {{ pkg.consumes_estimators ? '✓' : '✗' }} Consumes estimators
      </span>
    </section>

    <!-- ── Activity & maturity strip ── -->
    <section class="insight-card__activity">
      <div v-if="lastCommitRel" class="insight-card__signal" title="Last commit to the default branch">
        <i class="fas fa-code-commit"></i> Updated {{ lastCommitRel }}
      </div>
      <div v-if="releaseRel" class="insight-card__signal" title="Latest release on PyPI / GitHub">
        <i class="fas fa-tag"></i> v{{ pkg.version }} · {{ releaseRel }}
      </div>
    </section>

    <!-- ── Adoption (community size proxy) ── -->
    <section class="insight-card__adoption">
      <div class="insight-card__signal" title="GitHub stars">
        <i class="fas fa-star"></i> {{ fmt(pkg.stars) }}
      </div>
      <div v-if="forks" class="insight-card__signal" title="GitHub forks">
        <i class="fas fa-code-branch"></i> {{ fmt(forks) }}
      </div>
      <div class="insight-card__signal" title="Monthly PyPI downloads">
        <i class="fas fa-download"></i> {{ fmt(pkg.downloads) }}/mo
      </div>
    </section>

    <!-- ── Concrete use cases (task-level fit, by title) ── -->
    <section v-if="visibleUseCases.length" class="insight-card__usecases">
      <div class="insight-card__label">
        <i class="fas fa-lightbulb"></i>
        Used in {{ useCases.length }} curated use case{{ useCases.length !== 1 ? 's' : '' }}
      </div>
      <ul class="usecase-list">
        <li
          v-for="uc in visibleUseCases"
          :key="uc.uuid"
          class="usecase-link"
          @click="openUseCase(uc)"
        >
          <span class="usecase-link__title">{{ uc.title }}</span>
          <span
            class="difficulty-badge"
            :class="`difficulty-badge--${uc.difficulty}`"
          >
            {{ uc.difficulty }}
          </span>
        </li>
      </ul>
      <div v-if="extraUseCases" class="insight-card__more">
        + {{ extraUseCases }} more
      </div>
    </section>

    <!-- ── Install + outbound links ── -->
    <footer class="insight-card__foot">
      <div v-if="pkg.pypi_name" class="card__install" @click="copyInstall">
        <i class="fas fa-terminal"></i>
        <span>pip install {{ pkg.pypi_name }}</span>
        <i class="fas" :class="copied ? 'fa-check' : 'fa-copy'"></i>
      </div>
      <div class="card__links">
        <a v-if="pkg.website" :href="pkg.website" target="_blank" class="card__link">
          Homepage
        </a>
        <a v-if="pkg.repository" :href="pkg.repository" target="_blank" class="card__link">
          <i class="fab fa-github"></i> Repo
        </a>
        <a v-if="pkg.docs" :href="pkg.docs" target="_blank" class="card__link">
          <i class="fas fa-book"></i> Docs
        </a>
      </div>
    </footer>
  </article>
</template>

<style scoped>
.insight-card {
  background: var(--bg-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  padding: var(--space-6);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  transition: border-color var(--duration-md) var(--ease-out),
              box-shadow var(--duration-md) var(--ease-out);
}
.insight-card:hover {
  border-color: var(--color-near-black);
  box-shadow: var(--shadow-md);
}

.insight-card__head {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-right: 36px; /* leave room for the fit chip */
}
.insight-card__name {
  font-family: var(--brand-typography--title);
  font-size: var(--brand-typography-size--heading-h6);
  font-weight: 300;
  letter-spacing: -0.5px;
  line-height: 1.2;
  color: var(--text-primary);
  margin: 0;
}
.insight-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.insight-card__description {
  font-size: var(--text-md);
  line-height: 1.55;
  color: var(--text-secondary);
}

.insight-card__section,
.insight-card__usecases {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.insight-card__label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-widest);
  color: var(--text-muted);
}
.insight-card__label i {
  margin-right: 4px;
  color: var(--color-orange);
}

.insight-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
/* Task chips read more as "what this is good for" than the old hashtag-y
   tag pills. Slightly larger, slightly different feel from package chips. */
.task-chip {
  font-family: var(--font-sans);
  font-size: var(--brand-typography-size--body-s);
  color: var(--text-primary);
  background: var(--neutral-100, #f4f4f8);
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  line-height: 1.3;
}

.insight-card__compat {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.insight-card__activity,
.insight-card__adoption {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px dashed var(--neutral-200);
}
.insight-card__signal {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--brand-typography-size--body-s);
  color: var(--text-secondary);
}
.insight-card__signal i {
  color: var(--text-muted);
  font-size: 12px;
}

.usecase-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.usecase-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  background: var(--neutral-50, #fafafc);
  cursor: pointer;
  transition: background var(--duration-sm) var(--ease-out);
}
.usecase-link:hover {
  background: var(--neutral-100, #f4f4f8);
}
.usecase-link__title {
  font-size: var(--brand-typography-size--body-s);
  color: var(--text-primary);
  font-weight: 500;
}

.insight-card__more {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: 2px;
}

.insight-card__foot {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: auto; /* glue footer to bottom inside a flex column */
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
}
</style>
