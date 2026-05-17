<script setup lang="ts">
import { computed } from 'vue'
import { useReleaseCardHighlights } from '@/composables/useReleaseCardHighlights'
import type { Release, ReleaseHighlight } from '@/types/release'
import { fmt } from '@/utils/format'
import { releaseChangelogAnchorUrl } from '@/utils/releaseUrls'

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

const {
  cardRoot,
  highlightsRef,
  highlightsBodyId,
  highlightsExpanded,
  toggleHighlightsExpanded,
  highlightsExpandAriaLabel,
  showHighlightsToggle,
  shouldShowHighlight,
} = useReleaseCardHighlights(props)

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

const changelogUrl = computed(() =>
  isFuture.value ? null : releaseChangelogAnchorUrl(props.release.version),
)

const ctaLink = computed(() =>
  isFuture.value
    ? 'https://github.com/scikit-learn/scikit-learn/contribute'
    : `https://probabl.ai/support?utm_source=skl-central&utm_campaign=get_scikit-learn_support_v${props.release.version}`,
)
const ctaLabel = computed(() => (isFuture.value ? 'Contribute' : 'Get support'))
</script>

<template>
  <article
    ref="cardRoot"
    class="release-card card"
    :class="{ 'is-future': isFuture }"
  >
    <div class="body" :class="{ 'body--highlights-expanded': highlightsExpanded }">
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
        <div class="header-meta">
          <div class="date">{{ dateLabel }}</div>
          <span
            class="contributors pill"
            :class="{ 'contributors--empty': !contributorCount }"
            :title="contributorCount ? `${contributorCount} contributors` : undefined"
            :aria-hidden="contributorCount ? undefined : true"
          >
            <i class="fas fa-users" aria-hidden="true"></i>
            <span v-if="contributorCount">{{ contributorCount }}</span>
          </span>
        </div>
      </div>

      <section
        class="highlights-section synopsis"
        :class="{
          'synopsis--collapsed': !highlightsExpanded,
          'has-highlights-toggle': showHighlightsToggle && !highlightsExpanded,
        }"
        aria-label="Release highlights"
      >
        <ul
          :id="highlightsBodyId"
          ref="highlightsRef"
          class="highlights synopsis-text"
          :class="{ 'synopsis-text--clamped': !highlightsExpanded }"
        >
          <li
            v-for="(h, i) in highlights"
            v-show="shouldShowHighlight(i)"
            :key="i"
            class="highlight"
          >
            <span class="highlight-text">{{ h.text }}</span>
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
        <button
          v-if="showHighlightsToggle"
          type="button"
          class="synopsis-toggle"
          :aria-expanded="highlightsExpanded"
          :aria-controls="highlightsBodyId"
          :aria-label="highlightsExpandAriaLabel"
          @click="toggleHighlightsExpanded"
        >
          {{ highlightsExpanded ? 'Show less' : 'Show more' }}
        </button>
      </section>

      <section class="stats" aria-label="Changelog statistics">
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
        </div>
        <div class="stats-bar" :class="{ 'stats-bar--empty': !tagPills.length }">
          <div
            v-for="t in tagPills"
            :key="t.cssClass"
            class="seg"
            :class="`is-${t.cssClass}`"
            :style="{ width: t.pct + '%' }"
            :title="t.title"
          ></div>
        </div>
      </section>
    </div>

    <div class="footer">
      <div class="outbound">
        <a
          v-if="changelogUrl"
          :href="changelogUrl"
          target="_blank"
          rel="noopener"
          class="outbound-link"
          title="Changelog on scikit-learn.org"
        >
          <i class="fas fa-file-lines" aria-hidden="true"></i> Release notes
        </a>
        <a
          v-if="release.release_notes_url"
          :href="release.release_notes_url"
          target="_blank"
          rel="noopener"
          class="outbound-link"
          title="Release highlights on scikit-learn.org"
        >
          <i class="fas fa-star" aria-hidden="true"></i> Release highlights
        </a>
        <a
          :href="ctaLink"
          target="_blank"
          rel="noopener"
          class="outbound-link outbound-link--cta"
          :title="isFuture ? 'Contribute to scikit-learn' : 'Get scikit-learn support'"
        >
          <i
            class="fas"
            :class="isFuture ? 'fa-code-branch' : 'fa-life-ring'"
            aria-hidden="true"
          ></i>
          {{ ctaLabel }}
        </a>
      </div>
    </div>
  </article>
</template>

<style scoped>
.release-card.card {
  --card-outbound-inner-radius: calc(var(--radius-lg) - 1px);
  --release-highlights-clamp-height: calc(1.5em * 5 + var(--space-2) * 4);
  --release-highlights-toggle-reserve: calc(var(--space-2) + var(--text-xs) * 1.6);
  --release-stats-block-height: calc(
    var(--text-xs) * 1.6 + var(--space-2) + 7px + var(--space-3)
  );

  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  border-width: 1.5px;
  padding: var(--space-6) var(--space-6) 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  height: 100%;
  min-height: 0;
  transition:
    border-color 0.15s,
    transform 0.15s,
    box-shadow 0.15s;
}

.release-card.card:hover {
  border-color: var(--color-near-black);
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.release-card.card.is-future {
  background: var(--color-near-black);
  border-color: var(--color-near-black);
}

.release-card.card.is-future:hover {
  border-color: var(--color-orange);
  box-shadow: var(--shadow-midnight-card-hover);
}

.body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    'header'
    'highlights'
    'stats';
  gap: var(--space-3);
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.body.body--highlights-expanded {
  grid-template-rows: auto auto auto;
  min-height: auto;
}

.body.body--highlights-expanded .highlights-section {
  min-height: 0;
  overflow: visible;
}

.footer {
  display: flex;
  flex-direction: column;
  margin-top: auto;
  min-width: 0;
}

.header {
  grid-area: header;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
}

.highlights-section {
  grid-area: highlights;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-2);
  min-width: 0;
}

.highlights-section.synopsis--collapsed {
  min-height: var(--release-highlights-clamp-height);
}

.highlights-section.synopsis--collapsed.has-highlights-toggle {
  min-height: calc(
    var(--release-highlights-clamp-height) + var(--release-highlights-toggle-reserve)
  );
}

.highlights {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.5;
}

.highlights.synopsis-text--clamped {
  max-height: var(--release-highlights-clamp-height);
  flex: 0 0 auto;
}

.highlight {
  padding-left: var(--space-4);
  position: relative;
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  min-width: 0;
}

.highlight-text {
  min-width: 0;
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

.synopsis-toggle {
  align-self: flex-start;
  flex-shrink: 0;
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  text-decoration: underline;
  text-underline-offset: 3px;
  color: var(--text-muted);
  transition: color var(--duration-sm) var(--ease-out);
}

.synopsis-toggle:hover {
  color: var(--color-near-black);
}

.synopsis-toggle:focus-visible {
  outline: 2px solid var(--color-sky);
  outline-offset: 2px;
  border-radius: 2px;
}

.release-card.is-future .synopsis-toggle {
  color: var(--text-on-dark-subtle);
}

.release-card.is-future .synopsis-toggle:hover {
  color: var(--text-inverse);
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

.header-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
  flex-shrink: 0;
}

.date {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--neutral-500);
  white-space: nowrap;
  line-height: 1.4;
}

.release-card.is-future .date {
  color: var(--text-on-dark-muted);
}

.contributors.pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin: var(--space-1) 0 0;
  min-height: calc(var(--text-xs) * 1.6 + 2px);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 600;
  line-height: 1.6;
  background: var(--neutral-100);
  color: var(--neutral-600);
  white-space: nowrap;
}

.contributors--empty {
  visibility: hidden;
}

.release-card.is-future .contributors.pill {
  background: var(--surface-on-dark-raised);
  color: var(--text-on-dark-muted);
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
  grid-area: stats;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: var(--release-stats-block-height);
  padding-top: var(--space-3);
}

.stats-bar {
  display: flex;
  height: 7px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--neutral-200);
  flex-shrink: 0;
}

.stats-bar--empty {
  visibility: hidden;
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
  min-height: calc(var(--text-xs) * 1.6);
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

.release-card.card .outbound-link.outbound-link--cta {
  font-weight: 700;
  background: var(--color-orange);
  color: var(--color-near-black);
  border-left: 1px solid var(--color-orange);
}

.release-card.card:hover .outbound-link.outbound-link--cta {
  border-left-color: var(--color-orange);
}

.release-card.card .outbound-link.outbound-link--cta:hover {
  background: var(--bg-surface);
  color: var(--color-orange);
  border-left-color: var(--color-orange);
  box-shadow: inset 0 0 0 1px var(--color-orange);
}

.release-card.is-future .outbound {
  border-top-color: var(--border-on-dark-muted);
}

.release-card.is-future:hover .outbound {
  border-top-color: var(--color-orange);
}

.release-card.is-future .outbound-link {
  color: var(--text-on-dark-muted);
  background: var(--color-near-black);
  border-right-color: var(--border-on-dark-muted);
}

.release-card.is-future .outbound-link:hover {
  color: var(--text-inverse);
  background: var(--surface-on-dark-raised);
}

.release-card.is-future:hover .outbound-link {
  border-right-color: var(--border-on-dark-muted);
}

.release-card.is-future:hover .outbound-link:hover {
  border-right-color: var(--color-orange);
}

.release-card.is-future .outbound-link:nth-child(2):nth-last-child(2)::before,
.release-card.is-future .outbound-link:nth-child(2):nth-last-child(2)::after {
  background: var(--color-near-black);
  border-color: var(--border-on-dark-muted);
}

.release-card.is-future .outbound-link:nth-child(2):nth-last-child(2):hover::before,
.release-card.is-future .outbound-link:nth-child(2):nth-last-child(2):hover::after {
  background: var(--surface-on-dark-raised);
}

.release-card.is-future:hover .outbound-link:nth-child(2):nth-last-child(2)::before,
.release-card.is-future:hover .outbound-link:nth-child(2):nth-last-child(2)::after {
  border-color: var(--border-on-dark-muted);
}
</style>
