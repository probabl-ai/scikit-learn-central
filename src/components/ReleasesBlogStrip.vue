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
    <span class="releases-blog-strip__label">
      <i class="fas fa-rss"></i> From our blog
    </span>
    <a
      v-for="bp in posts"
      :key="bp.url"
      :href="bp.url"
      target="_blank"
      rel="noopener"
      class="releases-blog-strip__item"
    >
      <span class="releases-blog-strip__title">{{ bp.title }}</span>
      <span class="releases-blog-strip__meta">{{ bp.author }} · {{ bp.dateLabel }}</span>
    </a>
    <div class="releases-blog-strip__spacer"></div>
    <a
      href="https://blog.probabl.ai/tag/scikit-learn"
      target="_blank"
      rel="noopener"
      class="releases-blog-strip__more"
    >
      probabl.ai blog →
    </a>
    <a
      href="https://blog.scikit-learn.org"
      target="_blank"
      rel="noopener"
      class="releases-blog-strip__more"
    >
      sklearn blog →
    </a>
  </div>
</template>
