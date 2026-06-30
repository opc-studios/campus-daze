<template>
  <div class="page-container">
    <!-- 顶部导航 -->
    <nav class="flex items-center justify-between mb-10 animate-fade-in-up">
      <div class="flex items-center gap-4">
        <router-link to="/" class="game-title text-2xl">学术喵</router-link>
        <div class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
          <span class="text-yellow-400">⭐</span>
          <span class="text-white font-bold">{{ userStore.user?.username }}</span>
          <span class="text-gray-500 text-sm">Lv.{{ userStore.user?.level || 1 }}</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <router-link to="/battle" class="game-btn game-btn-danger text-sm px-4 py-2">⚔️ 战斗</router-link>
        <router-link to="/tasks" class="game-btn game-btn-gold text-sm px-4 py-2">📋 任务</router-link>
        <router-link to="/user-center" class="game-btn game-btn-primary text-sm px-4 py-2">👤 角色</router-link>
      </div>
    </nav>

    <!-- 校园地图标题 -->
    <div class="text-center mb-10 animate-fade-in-up delay-100">
      <div class="relative inline-block">
        <div class="absolute -inset-8 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-2xl animate-pulse"></div>
        <h2 class="relative text-4xl font-black text-white mb-2">🏫 校园地图</h2>
      </div>
      <p class="text-gray-400 mt-2">选择一个区域开始你的冒险之旅</p>
    </div>

    <!-- 区域卡片 -->
    <div class="game-grid max-w-5xl mx-auto">
      <div
        v-for="(area, index) in areas"
        :key="area.id"
        class="game-card p-6 cursor-pointer animate-fade-in-up relative overflow-hidden group"
        :class="[
          area.unlocked ? 'hover:scale-[1.02]' : 'opacity-40',
          area.unlocked ? 'game-card-glow-blue' : ''
        ]"
        :style="{ animationDelay: (0.2 + index * 0.1) + 's' }"
        @click="handleAreaClick(area)"
      >
        <!-- 浮动粒子 -->
        <div v-if="area.unlocked" class="floating-particles">
          <span class="particle"></span><span class="particle"></span>
          <span class="particle"></span><span class="particle"></span>
        </div>

        <div class="relative z-10">
          <div class="flex items-start justify-between mb-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <h3 class="text-xl font-bold text-white">{{ area.name }}</h3>
                <span class="game-badge" :class="area.unlocked ? 'game-badge-unlocked' : 'game-badge-locked'">
                  {{ area.unlocked ? '🔓 已解锁' : '🔒 未解锁' }}
                </span>
              </div>
              <p class="text-gray-400 text-sm">{{ area.description }}</p>
            </div>
            <span class="text-5xl group-hover:scale-110 transition-transform duration-300">{{ getAreaIcon(index) }}</span>
          </div>

          <!-- 探索进度 -->
          <div class="mb-3">
            <div class="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>探索进度</span>
              <span class="font-bold" :class="area.exploration_percent >= 100 ? 'text-green-400' : 'text-blue-400'">{{ area.exploration_percent }}%</span>
            </div>
            <div class="game-progress">
              <div
                class="game-progress-fill"
                :style="{
                  width: area.exploration_percent + '%',
                  background: getProgressGradient(index)
                }"
              ></div>
            </div>
          </div>

          <!-- 区域属性 -->
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xs text-gray-500">区域 {{ area.order }}</span>
            <span v-if="area.exploration_percent >= 100" class="game-badge game-badge-legendary text-xs">⭐ 完全探索</span>
          </div>

          <div v-if="area.unlocked" class="flex gap-2 mt-4 pt-4 border-t border-white/5">
            <button class="game-btn game-btn-primary text-xs px-4 py-2 flex-1" @click.stop="exploreArea(area)">
              🔍 探索
            </button>
            <button class="game-btn game-btn-danger text-xs px-4 py-2 flex-1" @click.stop="battleInArea(area)">
              ⚔️ 战斗
            </button>
            <button class="game-btn game-btn-purple text-xs px-4 py-2 flex-1" @click.stop="talkToNpc(area)">
              💬 对话
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速导航 -->
    <div class="max-w-5xl mx-auto mt-12 animate-fade-in-up delay-500">
      <div class="game-card p-6">
        <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span class="w-1 h-5 rounded-full bg-gradient-to-b from-blue-400 to-purple-400"></span>
          📍 快速导航
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <router-link to="/chapters" class="game-btn game-btn-purple text-sm">📖 章节</router-link>
          <router-link to="/stages" class="game-btn game-btn-primary text-sm">🏆 关卡</router-link>
          <router-link to="/rewards" class="game-btn game-btn-gold text-sm">🎁 奖励</router-link>
          <router-link to="/rest" class="game-btn game-btn-success text-sm">💤 休息</router-link>
          <router-link to="/saves" class="game-btn game-btn-secondary text-sm">💾 存档</router-link>
          <router-link to="/create-character" class="game-btn game-btn-primary text-sm">🐱 创建角色</router-link>
          <router-link to="/battle" class="game-btn game-btn-danger text-sm">⚔️ 战斗</router-link>
          <button class="game-btn game-btn-secondary text-sm" @click="handleLogout">🚪 退出</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { gameApi } from '@/api/game'

const router = useRouter()
const userStore = useUserStore()
const areas = ref([])

const areaIcons = ['🏛️', '📚', '🔬', '🏟️']
const progressGradients = [
  'linear-gradient(90deg, #4A90D9, #357ABD)',
  'linear-gradient(90deg, #9B59B6, #7D3C98)',
  'linear-gradient(90deg, #FF8C42, #E67E22)',
  'linear-gradient(90deg, #5CD85C, #45B745)'
]

function getAreaIcon(index) { return areaIcons[index % areaIcons.length] }
function getProgressGradient(index) { return progressGradients[index % progressGradients.length] }

function handleAreaClick(area) {
  if (area.unlocked) router.push(`/explore?area=${area.id}`)
}

function exploreArea(area) { router.push(`/explore?area=${area.id}`) }
function battleInArea(area) { router.push(`/battle?area=${area.id}`) }
function talkToNpc(area) { router.push(`/dialogue/${area.id}`) }

async function handleLogout() {
  await userStore.logoutWithSave()
  router.push('/login')
}

onMounted(async () => {
  try {
    const res = await gameApi.listAreas()
    areas.value = res || []
  } catch (e) {
    console.error('Failed to load areas:', e)
  }
})
</script>