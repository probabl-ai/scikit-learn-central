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
  <article class="release-card" :class="{ 'release-card--future': isFuture }">
    <div class="release-card__header">
      <div class="release-card__version">
        <a
          v-if="release.github_url"
          :href="release.github_url"
          target="_blank"
          rel="noopener"
          class="release-card__version-link"
        >
          {{ versionLabel }}
        </a>
        <span v-else class="release-card__version-link">{{ versionLabel }}</span>
      </div>
      <div class="release-card__date">{{ dateLabel }}</div>
    </div>

    <ul class="release-card__highlights">
      <li v-for="(h, i) in highlights" :key="i" class="release-highlight">
        {{ h.text }}
        <a
          v-if="h.issueUrl"
          :href="h.issueUrl"
          target="_blank"
          rel="noopener"
          class="release-highlight__vote"
          title="Vote on GitHub (👍 this issue)"
        >
          <i class="fas fa-thumbs-up"></i>
          <span v-if="h.countLabel">{{ h.countLabel }}</span>
        </a>
      </li>
    </ul>

    <div v-if="tagPills.length || contributorCount" class="release-card__stats">
      <div class="release-stats-pills">
        <span
          v-for="t in tagPills"
          :key="t.cssClass"
          class="release-stats-pill"
          :class="`release-stats-pill--${t.cssClass}`"
          :title="t.title"
        >
          {{ t.count }} {{ t.label }}
        </span>
        <span
          v-if="contributorCount"
          class="release-stats-pill release-stats-pill--contributors"
          :title="`${contributorCount} contributors`"
        >
          <i class="fas fa-users"></i> {{ contributorCount }}
        </span>
      </div>
      <div v-if="tagPills.length" class="release-stats-bar">
        <div
          v-for="t in tagPills"
          :key="t.cssClass"
          class="release-stats-bar__seg"
          :class="`release-stats-bar__seg--${t.cssClass}`"
          :style="{ width: t.pct + '%' }"
          :title="t.title"
        ></div>
      </div>
    </div>

    <div class="release-card__actions">
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
      <a :href="ctaLink" target="_blank" rel="noopener" class="btn btn--sm btn--cta">
        {{ ctaLabel }}
      </a>
      <a
        v-for="bp in release.blog_posts ?? []"
        :key="bp.url"
        :href="bp.url"
        target="_blank"
        rel="noopener"
        class="btn btn--sm release-card__blog-btn"
        :class="outlineClass"
        :title="bp.title"
      >
        <i class="fas fa-newspaper"></i>
      </a>
    </div>
  </article>
</template>
