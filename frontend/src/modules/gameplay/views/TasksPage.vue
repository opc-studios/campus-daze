<template>
  <div class="page-container">
    <div class="max-w-4xl mx-auto">
      <router-link to="/plaza" class="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <span>←</span> 返回广场
      </router-link>

      <div class="text-center mb-8 animate-fade-in-up">
        <div class="relative inline-block">
          <div class="absolute -inset-6 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 rounded-full blur-xl animate-pulse"></div>
          <h2 class="relative text-3xl font-black text-white mb-2">📋 任务列表</h2>
        </div>
        <p class="text-gray-400 mt-2">完成各项任务获取丰厚奖励</p>
      </div>

      <!-- 任务过滤器 -->
      <div class="flex gap-3 mb-6 justify-center animate-fade-in-up delay-100">
        <button
          v-for="filter in filters"
          :key="filter.key"
          class="game-btn text-sm px-6 py-2.5 transition-all"
          :class="activeFilter === filter.key ? 'game-btn-gold scale-105' : 'game-btn-secondary opacity-60 hover:opacity-100'"
          @click="activeFilter = filter.key"
        >
          {{ filter.icon }} {{ filter.label }}
        </button>
      </div>

      <!-- 任务卡片 -->
      <div class="space-y-4">
        <div
          v-for="(task, i) in filteredTasks"
          :key="task.id"
          class="game-card p-6 animate-fade-in-up group relative overflow-hidden"
          :class="'game-card-glow-gold'"
          :style="{ animationDelay: (i * 0.1) + 's' }"
        >
          <div class="floating-particles">
            <span class="particle"></span><span class="particle"></span>
          </div>

          <div class="relative z-10">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                {{ getTaskIcon(task.type) }}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-lg font-bold text-white">{{ task.name }}</h3>
                  <span class="game-badge" :class="getDifficultyClass(task.difficulty)">
                    {{ getDifficultyLabel(task.difficulty) }}
                  </span>
                  <span class="game-badge" :class="task.type === 1 ? 'game-badge-unlocked' : 'game-badge-rare'">
                    {{ task.type === 1 ? '主线' : '支线' }}
                  </span>
                </div>
                <p class="text-gray-400 text-sm">{{ task.description }}</p>
              </div>
              <span class="text-gray-500 text-sm">Lv.{{ task.required_level }}</span>
            </div>

            <div class="mt-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs text-gray-400">进度</span>
                  <span class="text-sm font-bold" :class="getProgressClass(task)">{{ task.objectives?.current || 0 }} / {{ task.objectives?.target || 1 }}</span>
                </div>
                <div class="w-32">
                  <div class="game-progress">
                    <div
                      class="game-progress-fill"
                      :style="{
                        width: getProgressPercent(task) + '%',
                        background: 'linear-gradient(90deg, #FFD700, #FFA500)'
                      }"
                    ></div>
                  </div>
                </div>
              </div>
              <button class="game-btn game-btn-gold text-xs px-4 py-2">
                {{ getProgressPercent(task) >= 100 ? '🎁 领取奖励' : '🔍 追踪任务' }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredTasks.length === 0" class="game-card p-12 text-center">
          <div class="text-5xl mb-4">📋</div>
          <p class="text-gray-400 text-lg">暂无任务</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { gameApi } from '@/api/game'

const router = useRouter()
const userStore = useUserStore()

async function handleLogout() {
  await userStore.logoutWithSave()
  router.push('/login')
}

const tasks = ref([])
const activeFilter = ref('all')
const filters = [
  { key: 'all', label: '全部', icon: '📋' },
  { key: 'main', label: '主线任务', icon: '⭐' },
  { key: 'side', label: '支线任务', icon: '📌' }
]

const filteredTasks = computed(() => {
  if (activeFilter.value === 'all') return tasks.value
  if (activeFilter.value === 'main') return tasks.value.filter(t => t.type === 1)
  if (activeFilter.value === 'side') return tasks.value.filter(t => t.type === 2)
  return tasks.value
})

function getTaskIcon(type) { return type === 1 ? '⭐' : '📌' }
function getDifficultyLabel(d) { return { 1: '简单', 2: '普通', 3: '困难' }[d] || '普通' }
function getDifficultyClass(d) { return { 1: 'game-badge-unlocked', 2: 'game-badge-rare', 3: 'game-badge-boss' }[d] || '' }
function getProgressPercent(task) {
  const cur = task.objectives?.current || 0
  const tar = task.objectives?.target || 1
  return Math.min(100, Math.round((cur / tar) * 100))
}
function getProgressClass(task) {
  const pct = getProgressPercent(task)
  return pct >= 100 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-blue-400'
}

onMounted(async () => {
  try {
    const res = await gameApi.listTasks()
    tasks.value = res || []
  } catch (e) {
    console.error('Failed to load tasks:', e)
  }
})
</script>