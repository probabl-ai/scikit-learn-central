import {
  createRouter,
  createWebHashHistory,
  type RouteLocationNormalized,
  type RouteRecordRaw,
} from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { tabKey: 'home' },
  },
  {
    path: '/catalog',
    name: 'catalog',
    component: () => import('@/views/PackagesView.vue'),
    meta: { tabKey: 'catalog' },
  },
  {
    path: '/use-cases',
    name: 'use-cases',
    component: () => import('@/views/UseCasesView.vue'),
    meta: { tabKey: 'use-cases' },
  },
  {
    path: '/mcp',
    name: 'mcp',
    component: () => import('@/views/MCPView.vue'),
    meta: { tabKey: 'mcp' },
  },
  {
    path: '/skills',
    name: 'skills',
    component: () => import('@/views/SkillsView.vue'),
    meta: { tabKey: 'skills' },
  },
  {
    path: '/releases',
    name: 'releases',
    component: () => import('@/views/ReleasesView.vue'),
    meta: { tabKey: 'releases' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: { tabKey: 'about' },
  },
]

// Dev-only sandbox. `import.meta.env.DEV` is statically replaced by Vite at
// build time, so this whole branch (and the dynamic import below) is dead-code
// eliminated in production — Components.vue is not bundled.
if (import.meta.env.DEV) {
  routes.push({
    path: '/components',
    name: 'components',
    component: () => import('@/views/Components.vue'),
    meta: { tabKey: 'components' },
  })
}

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to: RouteLocationNormalized) {
    // Views scroll to the target card when a deep-link query is present.
    if (to.name === 'use-cases' && to.query.slug) return false
    if (to.name === 'catalog' && to.query.package) return false
    if (to.hash) return { el: to.hash, top: 80 }
    return { top: 0 }
  },
})
