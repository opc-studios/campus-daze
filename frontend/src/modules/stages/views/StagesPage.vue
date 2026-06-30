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
          <div class="absolute -inset-6 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 rounded-full blur-xl animate-pulse"></div>
          <h2 class="relative text-3xl font-black text-white mb-2">🏆 关卡挑战</h2>
        </div>
        <p class="text-gray-400 mt-2">攻克难关，成为最强猫猫</p>
      </div>

      <div class="game-grid">
        <div
          v-for="(stage, i) in stages"
          :key="stage.id"
          class="game-card p-6 animate-fade-in-up group relative overflow-hidden"
          :class="'game-card-glow-blue'"
          :style="{ animationDelay: (i * 0.05) + 's' }"
        >
          <div class="floating-particles">
            <span class="particle"></span><span class="particle"></span>
          </div>

          <div class="relative z-10">
            <div class="flex items-center gap-4 mb-3">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                {{ stage.boss_id ? '👹' : '🏆' }}
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-white">{{ stage.name }}</h3>
                <p class="text-gray-400 text-sm">{{ stage.description }}</p>
              </div>
              <div class="text-right">
                <span class="text-blue-400 text-sm font-bold">Lv.{{ stage.required_level }}</span>
                <span v-if="stage.boss_id" class="game-badge game-badge-boss text-xs block mt-1">BOSS</span>
              </div>
            </div>

            <!-- 敌人预览 -->
            <div v-if="stage.enemies && stage.enemies.length" class="flex gap-2 mb-3 flex-wrap">
              <span
                v-for="enemy in stage.enemies"
                :key="enemy.id"
                class="px-2 py-1 rounded-lg bg-white/5 text-xs text-gray-300"
              >
                👾 {{ enemy.name }} Lv.{{ enemy.level }}
              </span>
            </div>

            <div class="flex gap-2 mt-3">
              <button class="game-btn game-btn-primary text-xs px-4 py-2 flex-1">
                ⚔️ 挑战
              </button>
              <button class="game-btn game-btn-secondary text-xs px-4 py-2 flex-1">
                📋 详情
              </button>
            </div>
          </div>
        </div>

        <div v-if="stages.length === 0" class="col-span-full game-card p-12 text-center">
          <div class="text-5xl mb-4">🏆</div>
          <p class="text-gray-400 text-lg">暂无可挑战的关卡</p>
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

const stages = ref([])

onMounted(async () => {
  try {
    const res = await gameApi.listStages()
    stages.value = res || []
  } catch (e) {
    console.error('Failed to load stages:', e)
  }
})
</script>