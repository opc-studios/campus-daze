import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import eventsConfig from './game/config/events.json'
import puzzlesConfig from './game/config/puzzles.json'

;(window as any).__gameConfigs = {
  events: eventsConfig,
  puzzles: puzzlesConfig
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')
