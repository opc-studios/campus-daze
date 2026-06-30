<template>
  <div class="page-container">
    <!-- 退出按钮 -->
    <button
      @click="handleLogout"
      class="fixed top-4 right-4 z-50 p-2.5 rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all duration-300 group"
      title="退出登录"
    >
      <svg class="w-5 h-5 text-white/70 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        <polyline points="10 17 15 12 10 7"/>
        <line x1="15" y1="12" x2="3" y2="12"/>
      </svg>
    </button>
    <div class="max-w-4xl mx-auto">
      <router-link to="/plaza" class="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <span>←</span> 返回广场
      </router-link>

      <div class="text-center mb-10 animate-fade-in-up">
        <div class="relative inline-block">
          <div class="absolute -inset-6 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 rounded-full blur-xl animate-pulse"></div>
          <h2 class="relative text-3xl font-black text-white mb-2">🎁 奖励中心</h2>
        </div>
        <p class="text-gray-400 mt-2">领取你的冒险奖励</p>
      </div>

      <div class="game-grid">
        <div
          v-for="(reward, i) in rewards"
          :key="reward.id"
          class="game-card p-6 text-center animate-fade-in-scale group relative overflow-hidden"
          :class="'game-card-glow-gold'"
          :style="{ animationDelay: (i * 0.1) + 's' }"
        >
          <div class="floating-particles">
            <span class="particle"></span><span class="particle"></span>
          </div>

          <div class="relative z-10">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center text-4xl mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
              🎁
            </div>
            <h3 class="text-lg font-bold text-white mb-4">{{ reward.name }}</h3>

            <div class="space-y-2 text-sm mb-4">
              <div class="flex justify-between py-2 px-3 rounded-lg bg-white/5 border border-white/5">
                <span class="text-gray-400">💎 金币</span>
                <span class="text-yellow-400 font-bold">+{{ reward.coin_amount }}</span>
              </div>
              <div class="flex justify-between py-2 px-3 rounded-lg bg-white/5 border border-white/5">
                <span class="text-gray-400">⭐ 经验</span>
                <span class="text-blue-400 font-bold">+{{ reward.exp_amount }}</span>
              </div>
              <div class="flex justify-between py-2 px-3 rounded-lg bg-white/5 border border-white/5">
                <span class="text-gray-400">🐟 猫粮</span>
                <span class="text-orange-400 font-bold">+{{ reward.cat_food_amount }}</span>
              </div>
            </div>

            <button class="game-btn game-btn-gold w-full">
              🎁 领取奖励
            </button>
          </div>
        </div>

        <div v-if="rewards.length === 0" class="col-span-full game-card p-12 text-center">
          <div class="text-5xl mb-4">🎁</div>
          <p class="text-gray-400 text-lg">暂无可用奖励</p>
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

async function handleLogout() {
  await userStore.logoutWithSave()
  router.push('/login')
}

const rewards = ref([])

onMounted(async () => {
  try {
    const res = await gameApi.listRewards()
    rewards.value = res || []
  } catch (e) {
    console.error('Failed to load rewards:', e)
  }
})
</script>