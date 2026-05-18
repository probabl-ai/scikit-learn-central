<script setup lang="ts">
import { computed } from 'vue'
import { useReleases } from '@/composables/useReleases'
import { useReleasesBlogStripOverflow } from '@/composables/useReleasesBlogStripOverflow'
import type { ReleaseBlogPost } from '@/types/release'

const { releases } = useReleases()

interface Post extends ReleaseBlogPost {
  dateLabel: string
}

const posts = computed<Post[]>(() => {
  const seen = new Set<string>()
  const out: Post[] = []
  for (const r of releases.value) {
    for (const bp of r.blog_posts ?? []) {
      if (seen.has(bp.url)) continue
      seen.add(bp.url)
      out.push({
        ...bp,
        dateLabel: new Date(bp.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
        }),
      })
    }
  }
  return out.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
})

const postCount = computed(() => posts.value.length)

const {
  postsExpanded,
  visiblePostCount,
  isCompactChrome,
  postsPanelRef,
  postsMeasureRailRef,
  postsOverflowBtnRef,
  hiddenPostCount,
  showPostsToggle,
  togglePostsExpanded,
} = useReleasesBlogStripOverflow(postCount)

const displayedPosts = computed(() => {
  if (postsExpanded.value) return posts.value
  return posts.value.slice(0, visiblePostCount.value)
})

const postsToggleLabel = computed(() => {
  if (postsExpanded.value) return 'Show less'
  const n = hiddenPostCount.value
  return n === 1 ? 'Show 1 more' : `Show ${n} more`
})
</script>

<template>
  <div
    v-if="posts.length"
    class="releases-blog-strip"
    :class="{ 'releases-blog-strip--compact': isCompactChrome }"
  >
    <div class="releases-blog-strip__header">
      <span class="label">
        <i class="fas fa-rss"></i> From our blog
      </span>
      <nav class="releases-blog-strip__links" aria-label="Blog hubs">
        <a
          href="https://blog.probabl.ai/tag/scikit-learn"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn--outline btn--sm releases-blog-strip__hub"
          aria-label="probabl.ai blog"
        >
          <img
            src="/images/favicon-32.png"
            alt=""
            class="releases-blog-strip__hub-icon releases-blog-strip__hub-icon--probabl"
            width="16"
            height="16"
          />
          <span class="releases-blog-strip__hub-text">
            <span class="releases-blog-strip__hub-brand">probabl.ai</span>
            <span class="releases-blog-strip__hub-word">blog</span>
          </span>
          <i
            class="fas fa-arrow-up-right-from-square releases-blog-strip__hub-external"
            aria-hidden="true"
          ></i>
        </a>
        <a
          href="https://blog.scikit-learn.org"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn--outline btn--sm releases-blog-strip__hub"
          aria-label="scikit-learn blog"
        >
          <img
            src="/images/spark.svg"
            alt=""
            class="releases-blog-strip__hub-icon releases-blog-strip__hub-icon--sklearn"
            width="16"
            height="10"
          />
          <span class="releases-blog-strip__hub-text">
            <span class="releases-blog-strip__hub-brand">scikit-learn</span>
            <span class="releases-blog-strip__hub-word">blog</span>
          </span>
          <i
            class="fas fa-arrow-up-right-from-square releases-blog-strip__hub-external"
            aria-hidden="true"
          ></i>
        </a>
      </nav>
    </div>

    <div
      ref="postsPanelRef"
      class="releases-blog-strip__posts"
      :class="{
        'releases-blog-strip__posts--expanded': postsExpanded,
        'releases-blog-strip__posts--compact': isCompactChrome,
      }"
    >
      <div
        ref="postsMeasureRailRef"
        class="posts-measure-rail"
        :class="{ 'posts-measure-rail--compact': isCompactChrome }"
        aria-hidden="true"
      >
        <a
          v-for="bp in posts"
          :key="`measure-${bp.url}`"
          data-post-measure
          :href="bp.url"
          class="item"
          tabindex="-1"
        >
          <span class="title">{{ bp.title }}</span>
          <span class="meta">{{ bp.author }} · {{ bp.dateLabel }}</span>
        </a>
      </div>

      <div
        class="posts-visible"
        :class="{ 'posts-visible--compact': isCompactChrome }"
      >
        <a
          v-for="bp in displayedPosts"
          :key="bp.url"
          :href="bp.url"
          target="_blank"
          rel="noopener"
          class="item"
        >
          <span class="title">{{ bp.title }}</span>
          <span class="meta">{{ bp.author }} · {{ bp.dateLabel }}</span>
        </a>
      </div>

      <button
        v-if="showPostsToggle"
        ref="postsOverflowBtnRef"
        type="button"
        class="posts-toggle"
        :aria-expanded="postsExpanded"
        @click="togglePostsExpanded"
      >
        {{ postsToggleLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.releases-blog-strip {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-4);
  background: var(--bg-surface);
  border: 1.5px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  margin-bottom: var(--space-6);
  min-width: 0;
}

.releases-blog-strip__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  min-width: 0;
}

.label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--neutral-500);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.releases-blog-strip__links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.releases-blog-strip__hub {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  white-space: nowrap;
}

.releases-blog-strip__hub-icon {
  flex-shrink: 0;
  width: 1rem;
  height: auto;
  object-fit: contain;
}

.releases-blog-strip__hub-icon--probabl {
  height: 1rem;
  width: 1rem;
}

.releases-blog-strip__hub-icon--sklearn {
  height: 0.625rem;
  width: 1rem;
}

.releases-blog-strip__hub-text {
  display: inline-flex;
  align-items: baseline;
  gap: 0.25em;
}

.releases-blog-strip__hub-external {
  flex-shrink: 0;
  font-size: 0.75em;
}

@media (max-width: 640px) {
  .releases-blog-strip__header {
    flex-wrap: nowrap;
    gap: var(--space-2);
  }

  .label {
    flex-shrink: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .releases-blog-strip__links {
    flex-shrink: 0;
    flex-wrap: nowrap;
  }

  .releases-blog-strip__hub {
    padding-inline: var(--space-3);
    gap: var(--space-1);
  }

  .releases-blog-strip__hub-brand {
    display: none;
  }
}

.releases-blog-strip__posts {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-3);
  min-width: 0;
}

.posts-measure-rail {
  position: absolute;
  left: 0;
  top: 0;
  visibility: hidden;
  pointer-events: none;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: var(--space-3);
  max-width: 100%;
}

.posts-measure-rail--compact {
  flex-direction: column;
  flex-wrap: nowrap;
  width: 100%;
}

.posts-visible {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: var(--space-3);
  min-width: 0;
}

.posts-visible--compact {
  flex-direction: column;
  flex-wrap: nowrap;
}

.item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 0 1 auto;
  text-decoration: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.posts-visible--compact .item {
  flex: 0 0 auto;
  width: 100%;
}

.item:hover {
  border-color: var(--color-near-black);
  box-shadow: var(--shadow-neutral-sm);
}

.title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  font-size: var(--text-xs);
  color: var(--neutral-500);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.posts-toggle {
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

.posts-toggle:hover {
  color: var(--color-near-black);
}

.posts-toggle:focus-visible {
  outline: 2px solid var(--color-sky);
  outline-offset: 2px;
  border-radius: 2px;
}
</style>
