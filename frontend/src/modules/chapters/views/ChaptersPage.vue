<template>
  <div class="page-container">
    <div class="max-w-4xl mx-auto">
      <router-link to="/plaza" class="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <span>←</span> 返回广场
      </router-link>

      <div class="text-center mb-10 animate-fade-in-up">
        <div class="relative inline-block">
          <div class="absolute -inset-6 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10 rounded-full blur-xl animate-pulse"></div>
          <h2 class="relative text-3xl font-black text-white mb-2">📖 游戏章节</h2>
        </div>
        <p class="text-gray-400 mt-2">展开你的校园冒险故事</p>
      </div>

      <div class="space-y-4">
        <div
          v-for="(chapter, i) in chapters"
          :key="chapter.id"
          class="game-card p-6 animate-fade-in-up group relative overflow-hidden"
          :class="chapter.unlocked ? 'game-card-glow-purple cursor-pointer' : 'opacity-50'"
          :style="{ animationDelay: (i * 0.1) + 's' }"
        >
          <!-- 浮动粒子（已解锁章节） -->
          <div v-if="chapter.unlocked" class="floating-particles">
            <span class="particle"></span><span class="particle"></span><span class="particle"></span>
          </div>

          <div class="relative z-10">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                📖
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-lg font-bold text-white">{{ chapter.name }}</h3>
                  <span class="game-badge" :class="chapter.unlocked ? 'game-badge-unlocked' : 'game-badge-locked'">
                    {{ chapter.unlocked ? '🔓 已解锁' : '🔒 未解锁' }}
                  </span>
                </div>
                <p class="text-gray-400 text-sm">{{ chapter.description }}</p>
              </div>
              <div class="text-right">
                <span class="text-purple-400 text-sm font-bold">Lv.{{ chapter.required_level }}</span>
                <div v-if="!chapter.unlocked" class="text-xs text-gray-500 mt-1">需要 {{ chapter.required_level }} 级</div>
              </div>
            </div>

            <!-- 场景预览 -->
            <div v-if="chapter.scenes && chapter.scenes.length" class="mt-4 flex gap-2 flex-wrap">
              <span
                v-for="(scene, si) in chapter.scenes"
                :key="scene.id"
                class="px-3 py-1.5 rounded-lg text-xs transition-all"
                :class="chapter.unlocked ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-white/5 text-gray-600'"
              >
                🎬 {{ scene.name }}
              </span>
            </div>

            <!-- 章节进度条 -->
            <div v-if="chapter.unlocked" class="mt-4">
              <div class="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>故事进度</span>
                <span class="text-purple-400 font-bold">{{ chapter.progress || 0 }}%</span>
              </div>
              <div class="game-progress">
                <div
                  class="game-progress-fill"
                  :style="{ width: (chapter.progress || 0) + '%', background: 'linear-gradient(90deg, #9B59B6, #FFB7C5)' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="chapters.length === 0" class="game-card p-12 text-center">
          <div class="text-5xl mb-4">📖</div>
          <p class="text-gray-400 text-lg">暂无可用章节</p>
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

const chapters = ref([])

onMounted(async () => {
  try {
    const res = await gameApi.listChapters()
    chapters.value = res || []
  } catch (e) {
    console.error('Failed to load chapters:', e)
  }
})
</script>