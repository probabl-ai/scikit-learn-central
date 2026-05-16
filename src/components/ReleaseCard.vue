<script setup lang="ts">
import { computed } from 'vue'
import type { Release, ReleaseHighlight } from '@/types/release'
import { fmt } from '@/utils/format'

const props = defineProps<{
  release: Release
}>()

interface TagConfig {
  key: keyof NonNullable<Release['stats']>['tag_counts']
  label: string
  cssClass: string
}

const TAG_CONFIG: ReadonlyArray<TagConfig> = [
  { key: 'major_feature', label: 'Major', cssClass: 'major-feature' },
  { key: 'feature', label: 'Feature', cssClass: 'feature' },
  { key: 'efficiency', label: 'Perf', cssClass: 'efficiency' },
  { key: 'enhancement', label: 'Enh', cssClass: 'enhancement' },
  { key: 'fix', label: 'Fix', cssClass: 'fix' },
  { key: 'api_change', label: 'API', cssClass: 'api-change' },
]

const isFuture = computed(() => props.release.version === 'future')

const versionLabel = computed(() =>
  isFuture.value ? 'FUTURE RELEASE' : `v${props.release.version}`,
)

const dateLabel = computed(() => {
  if (!props.release.date) return 'Upcoming'
  return new Date(props.release.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

interface NormalisedHighlight {
  text: string
  issueUrl: string | null
  countLabel: string | null
}

const highlights = computed<NormalisedHighlight[]>(() =>
  props.release.highlights.map((h) => {
    if (typeof h === 'string') {
      return { text: h, issueUrl: null, countLabel: null }
    }
    const hl = h as ReleaseHighlight
    return {
      text: hl.text,
      issueUrl: hl.github_issue_url ?? null,
      countLabel: hl.reaction_count != null ? fmt(hl.reaction_count) : null,
    }
  }),
)

interface TagPill {
  cssClass: string
  label: string
  count: number
  title: string
  pct: string
}

const tagPills = computed<TagPill[]>(() => {
  const s = props.release.stats
  if (!s?.tag_counts) return []
  const total = Object.values(s.tag_counts).reduce<number>(
    (a, b) => a + (b ?? 0),
    0,
  )
  if (total === 0) return []
  return TAG_CONFIG.filter((t) => (s.tag_counts[t.key] ?? 0) > 0).map((t) => {
    const count = s.tag_counts[t.key]!
    return {
      cssClass: t.cssClass,
      label: t.label,
      count,
      title: `${count} ${t.key.replace(/_/g, ' ')}`,
      pct: ((count / total) * 100).toFixed(2),
    }
  })
})

const contributorCount = computed(() => props.release.stats?.contributor_count)

const ctaLink = computed(() =>
  isFuture.value
    ? 'https://github.com/scikit-learn/scikit-learn/contribute'
    : `https://probabl.ai/support?utm_source=skl-central&utm_campaign=get_scikit-learn_support_v${props.release.version}`,
)
const ctaLabel = computed(() => (isFuture.value ? 'CONTRIBUTE' : 'GET SUPPORT'))

const outlineClass = computed(() =>
  isFuture.value ? 'btn--outline-white' : 'btn--outline-blue',
)
</script>

<template>
  <article class="release-card" :class="{ 'is-future': isFuture }">
    <div class="header">
      <div class="version">
        <a
          v-if="release.github_url"
          :href="release.github_url"
          target="_blank"
          rel="noopener"
          class="version-link"
        >
          {{ versionLabel }}
        </a>
        <span v-else class="version-link">{{ versionLabel }}</span>
      </div>
      <div class="date">{{ dateLabel }}</div>
    </div>

    <ul class="highlights">
      <li v-for="(h, i) in highlights" :key="i" class="highlight">
        {{ h.text }}
        <a
          v-if="h.issueUrl"
          :href="h.issueUrl"
          target="_blank"
          rel="noopener"
          class="vote"
          title="Vote on GitHub (👍 this issue)"
        >
          <i class="fas fa-thumbs-up"></i>
          <span v-if="h.countLabel">{{ h.countLabel }}</span>
        </a>
      </li>
    </ul>

    <div v-if="tagPills.length || contributorCount" class="stats">
      <div class="pills">
        <span
          v-for="t in tagPills"
          :key="t.cssClass"
          class="pill"
          :class="`is-${t.cssClass}`"
          :title="t.title"
        >
          {{ t.count }} {{ t.label }}
        </span>
        <span
          v-if="contributorCount"
          class="pill is-contributors"
          :title="`${contributorCount} contributors`"
        >
          <i class="fas fa-users"></i> {{ contributorCount }}
        </span>
      </div>
      <div v-if="tagPills.length" class="stats-bar">
        <div
          v-for="t in tagPills"
          :key="t.cssClass"
          class="seg"
          :class="`is-${t.cssClass}`"
          :style="{ width: t.pct + '%' }"
          :title="t.title"
        ></div>
      </div>
    </div>

    <div class="actions">
      <a
        v-if="release.release_notes_url"
        :href="release.release_notes_url"
        target="_blank"
        rel="noopener"
        class="btn btn--sm"
        :class="outlineClass"
      >
        RELEASE NOTES
      </a>
      <a :href="ctaLink" target="_blank" rel="noopener" class="btn btn--primary btn--sm btn--cta">
        {{ ctaLabel }}
      </a>
      <a
        v-for="bp in release.blog_posts ?? []"
        :key="bp.url"
        :href="bp.url"
        target="_blank"
        rel="noopener"
        class="btn btn--sm blog-btn"
        :class="outlineClass"
        :title="bp.title"
      >
        <i class="fas fa-newspaper"></i>
      </a>
    </div>
  </article>
</template>

<style scoped>
.release-card {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--border-subtle);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition:
    border-color 0.15s,
    transform 0.15s,
    box-shadow 0.15s;
}

.release-card:hover {
  border-color: var(--color-near-black);
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.release-card.is-future {
  background: var(--color-near-black);
  border-color: var(--color-near-black);
}

.release-card.is-future:hover {
  border-color: var(--color-orange);
  box-shadow: var(--shadow-midnight-card-hover);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
}

.version-link {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-decoration: none;
  color: var(--color-near-black);
}

.release-card.is-future .version-link {
  color: var(--color-orange);
}

a.version-link:hover {
  text-decoration: underline;
}

.date {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--neutral-500);
  white-space: nowrap;
  padding-top: 2px;
}

.release-card.is-future .date {
  color: var(--text-on-dark-muted);
}

.highlights {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
}

.highlight {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  padding-left: var(--space-4);
  position: relative;
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.highlight::before {
  content: '▸';
  position: absolute;
  left: 0;
  color: var(--color-near-black);
  font-size: 0.6em;
  top: 0.3em;
}

.release-card.is-future .highlight {
  color: var(--overlay-on-dark-soft);
}

.release-card.is-future .highlight::before {
  color: var(--color-orange);
}

.vote {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: auto;
  flex-shrink: 0;
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  font-weight: 600;
  text-decoration: none;
  color: var(--neutral-400);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  transition:
    color 0.15s,
    border-color 0.15s,
    background 0.15s;
  white-space: nowrap;
}

.vote:hover {
  color: var(--color-near-black);
  border-color: var(--color-near-black);
  background: var(--surface-sky-on-dark-soft);
}

.release-card.is-future .vote {
  color: var(--text-on-dark-subtle);
  border-color: var(--border-on-dark-muted);
  background: transparent;
}

.release-card.is-future .vote:hover {
  color: var(--text-inverse);
  border-color: var(--color-orange);
  background: var(--surface-orange-on-dark-strong);
}

.stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-3);
}

.stats-bar {
  display: flex;
  height: 7px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--neutral-200);
}

.seg {
  height: 100%;
  transition: opacity 0.15s;
}

.seg:hover {
  opacity: 0.72;
  cursor: default;
}

.seg.is-major-feature {
  background: var(--tag-major-feature);
}
.seg.is-feature {
  background: var(--tag-feature);
}
.seg.is-efficiency {
  background: var(--tag-efficiency);
}
.seg.is-enhancement {
  background: var(--tag-enhancement);
}
.seg.is-fix {
  background: var(--tag-fix);
}
.seg.is-api-change {
  background: var(--tag-api-change);
}

.pills {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  line-height: 1.6;
}

.pill.is-major-feature {
  background: var(--surface-tag-major-feature);
  color: var(--tag-major-feature);
}
.pill.is-feature {
  background: var(--surface-tag-feature-muted);
  color: var(--tag-feature);
}
.pill.is-efficiency {
  background: var(--surface-tag-efficiency-muted);
  color: var(--tag-efficiency);
}
.pill.is-enhancement {
  background: var(--surface-tag-enhancement-muted);
  color: var(--tag-enhancement);
}
.pill.is-fix {
  background: var(--surface-tag-fix-muted);
  color: var(--tag-fix);
}
.pill.is-api-change {
  background: var(--surface-tag-api-muted);
  color: var(--tag-api-change);
}
.pill.is-contributors {
  background: var(--neutral-100);
  color: var(--neutral-600);
  margin-left: auto;
}

.actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  align-items: center;
  padding-top: var(--space-3);
}

.blog-btn {
  margin-left: auto;
  padding: var(--space-2);
  line-height: 1;
}
</style>
