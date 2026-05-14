/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare global {
  interface Window {
    hljs?: {
      highlightElement: (el: HTMLElement) => void
    }
  }
}

export {}
