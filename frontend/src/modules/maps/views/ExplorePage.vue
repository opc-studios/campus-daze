<template>
  <div class="page-container">
    <div class="max-w-4xl mx-auto">
      <router-link to="/plaza" class="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"><span>←</span> 返回广场</router-link>
      <div class="text-center mb-10 animate-fade-in-up"><h2 class="text-3xl font-black text-white mb-2">🔍 探索区域</h2><p class="text-gray-400">探索校园，发现隐藏的秘密</p></div>
      <div class="game-card game-card-glow-blue p-8 text-center mb-6 animate-fade-in-scale">
        <div class="text-6xl mb-4 animate-float">🗺️</div>
        <h3 class="text-xl font-bold text-white mb-4">正在探索中...</h3>
        <div class="mb-4"><div class="game-progress max-w-md mx-auto"><div class="game-progress-fill" :style="{ width: explorationProgress + '%', background: 'linear-gradient(90deg, #4A90D9, #FFB7C5)' }"></div></div></div>
        <p class="text-gray-400 text-sm mb-6">探索进度: {{ explorationProgress }}%</p>
        <div class="flex gap-3 justify-center">
          <button class="game-btn game-btn-primary" @click="explore">🔍 继续探索</button>
          <button class="game-btn game-btn-secondary" @click="stopExplore">⏹️ 停止探索</button>
        </div>
      </div>
      <div v-if="discoveries.length > 0" class="game-card p-6 animate-fade-in-up">
        <h3 class="text-lg font-bold text-white mb-4">✨ 发现物</h3>
        <div class="grid grid-cols-3 gap-3">
          <div v-for="(item, i) in discoveries" :key="i" class="p-4 rounded-xl bg-white/5 text-center">
            <div class="text-2xl mb-1">{{ item.icon }}</div>
            <div class="text-xs text-gray-300">{{ item.name }}</div>
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
const explorationProgress = ref(0)
const discoveries = ref([])
const items = [{ icon: '📖', name: '古籍' }, { icon: '💎', name: '宝石' }, { icon: '🔮', name: '水晶' }, { icon: '🧪', name: '药剂' }, { icon: '📜', name: '卷轴' }, { icon: '🗝️', name: '钥匙' }]
function explore() {
  if (explorationProgress.value < 100) {
    explorationProgress.value = Math.min(100, explorationProgress.value + Math.floor(Math.random() * 20) + 5)
    if (Math.random() > 0.5) discoveries.value.push(items[Math.floor(Math.random() * items.length)])
  }
}
function stopExplore() { explorationProgress.value = 0 }
</script>