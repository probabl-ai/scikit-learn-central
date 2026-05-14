import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/catalog',
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

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})
