<template>
  <div class="min-h-screen bg-gradient-to-br from-[#FAFAF5] to-[#FFB7C5] p-6 floating-particles">
    <div class="max-w-6xl mx-auto">
      <div class="mb-6 flex justify-between items-center">
        <h1 class="text-3xl font-bold text-[#1A3C6E]">主页</h1>
        <button @click="handleLogout" class="game-button">
          登出
        </button>
      </div>
      
      <ResourceBar
        :level="gameStore.player?.level || 1"
        :exp="gameStore.player?.exp || 0"
        :exp-to-next="100"
        :credits="gameStore.resources?.credits || 0"
        :coins="gameStore.resources?.coins || 0"
        class="mb-8"
      />
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="item in menuItems"
          :key="item.id"
          @click="navigateTo(item.route)"
          class="game-card-neon p-8 cursor-pointer"
        >
          <div class="text-5xl mb-4 text-center">{{ item.icon }}</div>
          <h3 class="text-xl font-bold text-[#1A3C6E] text-center mb-2">{{ item.name }}</h3>
          <p class="text-sm text-gray-600 text-center">{{ item.description }}</p>
        </div>
      </div>
      
      <IdlePanel class="mt-8" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { useUserStore } from '../stores/user'
import ResourceBar from '../components/ui/ResourceBar.vue'
import IdlePanel from '../components/IdlePanel.vue'

const router = useRouter()
const gameStore = useGameStore()
const userStore = useUserStore()

const menuItems = [
  { id: 'growth', name: '角色成长', icon: '📈', description: '查看属性与技能', route: '/growth' },
  { id: 'map', name: '章节地图', icon: '🗺️', description: '探索校园', route: '/map' },
  { id: 'inventory', name: '背包', icon: '🎒', description: '管理道具', route: '/inventory' },
  { id: 'archive', name: '校史图鉴', icon: '📖', description: '收集校史', route: '/archive' }
]

onMounted(async () => {
  await gameStore.loadSave()
})

const navigateTo = (route: string) => {
  router.push(route)
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>
