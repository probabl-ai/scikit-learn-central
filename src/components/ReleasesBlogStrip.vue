<script setup lang="ts">
import { computed } from 'vue'
import { useReleases } from '@/composables/useReleases'
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
  return out
})
</script>

<template>
  <div v-if="posts.length" class="releases-blog-strip">
    <span class="label">
      <i class="fas fa-rss"></i> From our blog
    </span>
    <a
      v-for="bp in posts"
      :key="bp.url"
      :href="bp.url"
      target="_blank"
      rel="noopener"
      class="item"
    >
      <span class="title">{{ bp.title }}</span>
      <span class="meta">{{ bp.author }} · {{ bp.dateLabel }}</span>
    </a>
    <div class="spacer"></div>
    <a
      href="https://blog.probabl.ai/tag/scikit-learn"
      target="_blank"
      rel="noopener"
      class="more"
    >
      probabl.ai blog →
    </a>
    <a href="https://blog.scikit-learn.org" target="_blank" rel="noopener" class="more">
      sklearn blog →
    </a>
  </div>
</template>

<style scoped>
.releases-blog-strip {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--bg-surface);
  border: 1.5px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-5);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}

.label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--neutral-500);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  margin-right: var(--space-1);
}

.item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-decoration: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.item:hover {
  border-color: var(--color-near-black);
  box-shadow: var(--shadow-neutral-sm);
}

.title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.meta {
  font-size: var(--text-xs);
  color: var(--neutral-500);
}

.spacer {
  flex: 1;
}

.more {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--color-near-black);
  text-decoration: none;
  white-space: nowrap;
  padding: var(--space-1) 0;
}

.more:hover {
  text-decoration: underline;
}
</style>
