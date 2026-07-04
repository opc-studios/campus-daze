import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
// D.2.7 配表热更新：静态 import 作为 fallback（API 不可用时兜底）
import eventsConfigFallback from './game/config/events.json'
import puzzlesConfigFallback from './game/config/puzzles.json'

/**
 * D.2.7 启动时拉取最新配表（ETag + localStorage 缓存），失败则用静态 import 兜底。
 * 仅 events/puzzles 走 API（与原 main.ts 范围一致），其他 7 个 JSON 保持编译期 import。
 */
async function loadGameConfigs(): Promise<void> {
  const configsToFetch = ['events', 'puzzles']
  const fallbacks: Record<string, any> = {
    events: eventsConfigFallback,
    puzzles: puzzlesConfigFallback
  }

  const result: Record<string, any> = {}

  await Promise.all(
    configsToFetch.map(async (name) => {
      try {
        const cachedEtag = localStorage.getItem(`__configEtag_${name}`)
        const headers: Record<string, string> = {}
        if (cachedEtag) {
          headers['If-None-Match'] = cachedEtag
        }
        const resp = await fetch(`/api/configs/${name}`, { headers })
        if (resp.status === 304) {
          // 缓存仍有效，从 localStorage 取
          const cachedContent = localStorage.getItem(`__configContent_${name}`)
          if (cachedContent) {
            result[name] = JSON.parse(cachedContent)
            return
          }
        }
        if (resp.ok) {
          const data = await resp.json()
          const etag = resp.headers.get('ETag')
          result[name] = data
          // 写入 localStorage 缓存
          if (etag) {
            localStorage.setItem(`__configEtag_${name}`, etag)
            localStorage.setItem(`__configContent_${name}`, JSON.stringify(data))
          }
          return
        }
      } catch (e) {
        console.warn(`[main] Failed to fetch config ${name}, using fallback`, e)
      }
      // fallback
      result[name] = fallbacks[name]
    })
  )

  ;(window as any).__gameConfigs = result
}

async function bootstrap() {
  await loadGameConfigs()

  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)
  app.mount('#app')
}

bootstrap()
