<template>
  <div class="min-h-screen bg-gradient-to-br from-[#FAFAF5] via-[#FFE5EC] to-[#FFB7C5] floating-particles relative overflow-hidden">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10">
      <div class="mb-4 flex justify-between items-center">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-[#1A3C6E]">学术喵 · 校园</h1>
          <p class="text-sm text-gray-600 mt-1">第 {{ gameStore.currentChapter + 1 }} 章 · {{ chapterTitle }}</p>
        </div>
        <button @click="handleLogout" class="game-button">登出</button>
      </div>

      <ResourceBar
        :level="gameStore.player?.level || 1"
        :exp="gameStore.player?.exp || 0"
        :exp-to-next="100"
        :credits="gameStore.resources?.credits || 0"
        :coins="gameStore.resources?.coins || 0"
        class="mb-6"
      />

      <div class="relative w-full max-w-5xl mx-auto" style="aspect-ratio: 16 / 9;">
        <div class="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
          <svg viewBox="0 0 1280 720" class="w-full h-full block" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="bgSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#A8D8EA" />
                <stop offset="60%" stop-color="#FFCCE5" />
                <stop offset="100%" stop-color="#FFB7C5" />
              </linearGradient>
              <linearGradient id="bgFloor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#E8D8B0" />
                <stop offset="100%" stop-color="#C8A878" />
              </linearGradient>
              <radialGradient id="catGlow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.6" />
                <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
              </radialGradient>
            </defs>

            <rect x="0" y="0" width="1280" height="500" fill="url(#bgSky)" />
            <rect x="0" y="500" width="1280" height="220" fill="url(#bgFloor)" />

            <circle cx="1100" cy="120" r="50" fill="#FFF5C0" opacity="0.8" />
            <circle cx="1100" cy="120" r="70" fill="url(#catGlow)" />

            <rect x="200" y="380" width="240" height="140" rx="8" fill="#8B6F47" />
            <rect x="220" y="400" width="200" height="100" rx="4" fill="#A88254" />
            <rect x="270" y="430" width="100" height="60" rx="4" fill="#5D4A30" />

            <g v-for="hot in hotspots" :key="hot.id">
              <circle
                :cx="hot.x"
                :cy="hot.y"
                :r="hot.r"
                :fill="hot.color"
                :opacity="hot.unlocked ? 0.85 : 0.35"
                stroke="#FFFFFF"
                stroke-width="4"
                class="cursor-pointer transition-all"
                :class="{ 'opacity-100': hoveredId === hot.id }"
                @click="navigateTo(hot)"
                @mouseenter="hoveredId = hot.id"
                @mouseleave="hoveredId = null"
              />
              <circle :cx="hot.x" :cy="hot.y" :r="hot.r + 8" fill="none" :stroke="hot.color" stroke-width="2" opacity="0.5">
                <animate attributeName="r" :values="`${hot.r + 4};${hot.r + 12};${hot.r + 4}`" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite" />
              </circle>
              <text
                :x="hot.x"
                :y="hot.y + hot.r + 28"
                text-anchor="middle"
                font-family="'Microsoft YaHei', sans-serif"
                :font-size="hot.unlocked ? '22' : '20'"
                :fill="hot.unlocked ? '#1A3C6E' : '#888888'"
                font-weight="bold"
                class="pointer-events-none select-none"
              >
                {{ hot.label }}
              </text>
              <text
                :x="hot.x"
                :y="hot.y + hot.r + 50"
                text-anchor="middle"
                font-family="'Microsoft YaHei', sans-serif"
                font-size="14"
                fill="#666666"
                class="pointer-events-none select-none"
              >
                {{ hot.sub }}
              </text>
              <text
                :x="hot.x"
                :y="hot.y + 6"
                text-anchor="middle"
                dominant-baseline="middle"
                font-family="Arial, sans-serif"
                font-size="36"
                fill="#FFFFFF"
                class="pointer-events-none select-none"
              >
                {{ hot.icon }}
              </text>
              <g v-if="!hot.unlocked">
                <rect :x="hot.x - 14" :y="hot.y - 14" width="28" height="28" rx="4" fill="#444444" opacity="0.7" />
                <text :x="hot.x" :y="hot.y + 6" text-anchor="middle" dominant-baseline="middle" font-size="18" fill="#FFFFFF">🔒</text>
              </g>
            </g>

            <g>
              <ellipse cx="640" cy="660" rx="80" ry="14" fill="#000000" opacity="0.2" />
              <circle cx="640" cy="560" r="60" fill="#FFD1DC" stroke="#FFFFFF" stroke-width="3" />
              <polygon points="610,540 615,505 630,535" fill="#FFD1DC" stroke="#FFFFFF" stroke-width="2" />
              <polygon points="670,540 665,505 650,535" fill="#FFD1DC" stroke="#FFFFFF" stroke-width="2" />
              <circle cx="625" cy="555" r="6" fill="#1A3C6E" />
              <circle cx="655" cy="555" r="6" fill="#1A3C6E" />
              <path d="M 630 575 Q 640 585 650 575" stroke="#1A3C6E" stroke-width="2" fill="none" stroke-linecap="round" />
              <path d="M 620 580 L 625 585 M 660 580 L 655 585" stroke="#FFFFFF" stroke-width="2" />
            </g>
          </svg>
        </div>

        <div
          v-if="hoveredHotspot"
          class="absolute z-20 pointer-events-none"
          :style="tooltipStyle"
        >
          <div class="bg-white/95 backdrop-blur px-4 py-3 rounded-lg shadow-xl border border-[#FFB7C5] max-w-xs">
            <p class="font-bold text-[#1A3C6E] text-sm">{{ hoveredHotspot.label }}</p>
            <p class="text-xs text-gray-600 mt-1">{{ hoveredHotspot.desc }}</p>
          </div>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          v-for="hot in hotspots"
          :key="`btn-${hot.id}`"
          @click="navigateTo(hot)"
          :disabled="!hot.unlocked"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-semibold shadow transition-all',
            hot.unlocked
              ? 'bg-white text-[#1A3C6E] hover:shadow-lg hover:-translate-y-0.5'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          ]"
        >
          <span class="mr-1">{{ hot.icon }}</span>
          {{ hot.label }}
        </button>
      </div>

      <IdlePanel class="mt-6" />
    </div>

    <div
      v-if="showEventPanel"
      class="fixed inset-0 z-30 flex items-center justify-center bg-black/50"
      @click.self="showEventPanel = false"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 game-card-neon">
        <h3 class="text-xl font-bold text-[#1A3C6E] mb-2">便签 · 随机事件</h3>
        <p class="text-sm text-gray-600 mb-4">前往地图探索时可能触发随机事件，挂机时也可能收到学风精灵的来信。</p>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p class="text-xs text-yellow-800">已触发事件：{{ gameStore.progress?.seenEvents?.length || 0 }} 次</p>
        </div>
        <button @click="showEventPanel = false" class="game-button w-full">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { useUserStore } from '../stores/user'
import ResourceBar from '../components/ui/ResourceBar.vue'
import IdlePanel from '../components/IdlePanel.vue'

const router = useRouter()
const gameStore = useGameStore()
const userStore = useUserStore()

const hoveredId = ref<string | null>(null)
const showEventPanel = ref(false)

interface Hotspot {
  id: string
  label: string
  sub: string
  desc: string
  icon: string
  x: number
  y: number
  r: number
  color: string
  route?: string
  unlocked: boolean
  action?: () => void
}

const chapterTitle = computed(() => {
  const ch = gameStore.currentChapter || 0
  const titles = ['入学启程', '李庄岁月', '改革开放', '同舟共济']
  return titles[ch] || '入学启程'
})

const hotspots = computed<Hotspot[]>(() => {
  const ch = gameStore.currentChapter || 0
  return [
    {
      id: 'cat',
      label: '学术喵',
      sub: '本体',
      desc: '查看角色立绘与双形态信息',
      icon: '🐱',
      x: 640,
      y: 560,
      r: 50,
      color: '#FFB7C5',
      unlocked: true,
      action: () => router.push('/growth')
    },
    {
      id: 'study',
      label: '课桌',
      sub: '学习',
      desc: '查看挂机学习任务与离线收益',
      icon: '📚',
      x: 320,
      y: 450,
      r: 38,
      color: '#4ECDC4',
      unlocked: true,
      action: () => {
        const el = document.getElementById('idle-panel')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }
    },
    {
      id: 'intern',
      label: '实习工牌',
      sub: '实习',
      desc: '切换为实习挂机赚取校园币',
      icon: '💼',
      x: 960,
      y: 450,
      r: 38,
      color: '#FFD700',
      unlocked: ch >= 1,
      action: () => {
        const el = document.getElementById('idle-panel')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }
    },
    {
      id: 'inventory',
      label: '书包',
      sub: '背包',
      desc: '管理道具与携带槽装配',
      icon: '🎒',
      x: 200,
      y: 250,
      r: 40,
      color: '#9B59B6',
      route: '/inventory',
      unlocked: true
    },
    {
      id: 'archive',
      label: '公告板',
      sub: '图鉴',
      desc: '查看校史图鉴收集进度与章节结局',
      icon: '📖',
      x: 1080,
      y: 250,
      r: 40,
      color: '#E67E22',
      route: '/archive',
      unlocked: true
    },
    {
      id: 'map',
      label: '地图屏幕',
      sub: '地图',
      desc: '进入章节大地图探索',
      icon: '🗺️',
      x: 640,
      y: 200,
      r: 50,
      color: '#1A3C6E',
      route: '/map',
      unlocked: true
    },
    {
      id: 'event',
      label: '便签',
      sub: '随机事件',
      desc: '查看随机事件记录与提示',
      icon: '📝',
      x: 640,
      y: 360,
      r: 36,
      color: '#FF6B9D',
      unlocked: true,
      action: () => {
        showEventPanel.value = true
      }
    }
  ]
})

const hoveredHotspot = computed(() => {
  if (!hoveredId.value) return null
  return hotspots.value.find(h => h.id === hoveredId.value) || null
})

const tooltipStyle = computed(() => {
  if (!hoveredHotspot.value) return {}
  const hot = hoveredHotspot.value
  const xPct = (hot.x / 1280) * 100
  const yPct = (hot.y / 720) * 100
  return {
    left: `${xPct}%`,
    top: `${yPct}%`,
    transform: 'translate(-50%, -120%)'
  }
})

onMounted(async () => {
  await gameStore.loadSave()
})

const navigateTo = (hot: Hotspot) => {
  if (!hot.unlocked) return
  if (hot.action) {
    hot.action()
    return
  }
  if (hot.route) {
    router.push(hot.route)
  }
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>
