<template>
  <div class="page-container">
    <div class="max-w-2xl mx-auto">
      <router-link to="/plaza" class="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <span>←</span> 返回广场
      </router-link>

      <div class="game-card game-card-neon p-8 text-center animate-fade-in-scale relative overflow-hidden">
        <div class="floating-particles">
          <span class="particle"></span><span class="particle"></span><span class="particle"></span>
        </div>

        <div class="relative z-10">
          <div class="text-6xl mb-4 animate-float">💤</div>
          <h2 class="text-3xl font-black text-white mb-2">休息区</h2>
          <p class="text-gray-400 mb-8">恢复体力，准备下一次冒险</p>

          <div class="grid grid-cols-2 gap-6 mb-8">
            <div class="stat-panel text-center">
              <div class="text-2xl font-black text-green-400">{{ items.food }}</div>
              <div class="stat-label">🍖 食物</div>
              <p class="text-xs text-gray-500 mt-1">恢复 30HP</p>
            </div>
            <div class="stat-panel text-center">
              <div class="text-2xl font-black text-blue-400">{{ items.potion }}</div>
              <div class="stat-label">💊 药水</div>
              <p class="text-xs text-gray-500 mt-1">恢复 20MP</p>
            </div>
          </div>

          <div class="flex gap-3 justify-center">
            <button class="game-btn game-btn-success px-8" @click="useItem('food')">
              🍖 使用食物 (+30HP)
            </button>
            <button class="game-btn game-btn-primary px-8" @click="useItem('potion')">
              💊 使用药水 (+20MP)
            </button>
          </div>

          <hr class="game-divider" />

          <div class="text-center">
            <p class="text-gray-400 text-sm mb-4">或者直接休息，缓慢恢复体力</p>
            <button class="game-btn game-btn-purple px-8" @click="startResting">
              {{ resting ? '⏳ 休息中...' : '🛌 开始休息' }}
            </button>
            <p v-if="resting" class="text-green-400 text-sm mt-3 animate-pulse">正在恢复体力中...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

async function handleLogout() {
  await userStore.logoutWithSave()
  router.push('/login')
}

const items = ref({ food: 5, potion: 3 })
const resting = ref(false)

function useItem(type) {
  if (items.value[type] > 0) {
    items.value[type]--
    alert(type === 'food' ? '使用了食物，恢复30HP！' : '使用了药水，恢复20MP！')
  } else {
    alert('物品不足！')
  }
}

function startResting() {
  resting.value = true
  setTimeout(() => {
    resting.value = false
    alert('休息完成！体力和魔力已完全恢复！')
  }, 3000)
}
</script>