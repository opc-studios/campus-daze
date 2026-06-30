<template>
  <div class="page-container">
    <div class="max-w-2xl mx-auto">
      <router-link to="/plaza" class="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <span>←</span> 返回广场
      </router-link>

      <!-- 用户信息卡片 -->
      <div class="game-card game-card-neon p-8 mb-6 animate-fade-in-scale">
        <div class="text-center mb-6">
          <div class="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-6xl mx-auto mb-4 border-2 border-white/10 animate-float">
            🐱
          </div>
          <h2 class="text-3xl font-black text-white mb-2">{{ userStore.user?.username }}</h2>
          <p class="text-gray-400">Lv.{{ userStore.user?.level || 1 }} · {{ userStore.user?.role || '冒险者' }}</p>
        </div>

        <div class="grid grid-cols-3 gap-4 text-center">
          <div class="stat-panel">
            <div class="stat-value">{{ userStats.coins }}</div>
            <div class="stat-label">💎 金币</div>
          </div>
          <div class="stat-panel">
            <div class="stat-value">{{ userStats.exp }}</div>
            <div class="stat-label">⭐ 经验</div>
          </div>
          <div class="stat-panel">
            <div class="stat-value gradient-text-gold">{{ userStats.catFood }}</div>
            <div class="stat-label">🐟 猫粮</div>
          </div>
        </div>
      </div>

      <!-- 账号信息 -->
      <div class="game-card p-6 mb-6 animate-fade-in-up delay-100">
        <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span class="w-1 h-4 rounded-full bg-gradient-to-b from-blue-400 to-purple-400"></span>
          📋 账号信息
        </h3>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between py-2 border-b border-white/5">
            <span class="text-gray-400">邮箱</span>
            <span class="text-white">{{ userStore.user?.email }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-white/5">
            <span class="text-gray-400">注册时间</span>
            <span class="text-white">{{ formatDate(userStore.user?.created_at) }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-white/5">
            <span class="text-gray-400">角色数量</span>
            <span class="text-white">{{ characterCount }} 个</span>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="game-card p-6 animate-fade-in-up delay-200">
        <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span class="w-1 h-4 rounded-full bg-gradient-to-b from-yellow-400 to-orange-400"></span>
          🎮 快捷操作
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <router-link to="/plaza" class="game-btn game-btn-primary text-center">🏫 校园广场</router-link>
          <router-link to="/create-character" class="game-btn game-btn-gold text-center">🐱 创建角色</router-link>
          <router-link to="/saves" class="game-btn game-btn-secondary text-center">💾 存档管理</router-link>
          <button class="game-btn game-btn-danger text-center" @click="handleLogout">🚪 退出登录</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { characterApi } from '@/api/character'

const router = useRouter()
const userStore = useUserStore()
const characterCount = ref(0)
const userStats = ref({
  coins: 0,
  exp: 0,
  catFood: 0
})

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}

onMounted(async () => {
  try {
    const chars = await characterApi.listCharacters()
    characterCount.value = chars?.length || 0
    // 统计从第一个角色获取数据
    if (chars && chars.length > 0) {
      userStats.value = {
        coins: chars[0].coins || 0,
        exp: chars[0].exp || 0,
        catFood: chars[0].cat_food || 0
      }
    }
  } catch (e) {
    console.error(e)
  }
})
</script>