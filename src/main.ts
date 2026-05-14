import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'

import './assets/css/design-system.css'
import './assets/css/components.css'

createApp(App).use(router).mount('#app')
