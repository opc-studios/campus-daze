<template>
  <div class="page-container">
    <div class="max-w-4xl mx-auto">
      <router-link to="/plaza" class="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <span>←</span> 返回广场
      </router-link>

      <div class="flex items-center justify-between mb-10 animate-fade-in-up">
        <div>
          <div class="relative inline-block">
            <div class="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 rounded-full blur-lg animate-pulse"></div>
            <h2 class="relative text-3xl font-black text-white mb-2">💾 存档管理</h2>
          </div>
          <p class="text-gray-400">管理你的游戏存档</p>
        </div>
        <button class="game-btn game-btn-primary" @click="createSave">
          ➕ 创建新存档
        </button>
      </div>

      <div class="game-grid">
        <div
          v-for="(save, i) in saves"
          :key="save.id"
          class="game-card p-6 animate-fade-in-up group relative overflow-hidden"
          :class="'game-card-glow-blue'"
          :style="{ animationDelay: (i * 0.1) + 's' }"
        >
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <span class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-sm">💾</span>
                存档 {{ save.slot_number || i + 1 }}
              </h3>
              <span class="text-xs text-gray-500">{{ formatDate(save.created_at) }}</span>
            </div>

            <div class="grid grid-cols-2 gap-2 text-sm mb-4">
              <div class="px-3 py-2 rounded-lg bg-white/5 flex justify-between">
                <span class="text-gray-400">等级</span>
                <span class="text-white font-bold">Lv.{{ save.level || 1 }}</span>
              </div>
              <div class="px-3 py-2 rounded-lg bg-white/5 flex justify-between">
                <span class="text-gray-400">进度</span>
                <span class="text-white font-bold">{{ save.progress || 0 }}%</span>
              </div>
            </div>

            <div class="flex gap-2">
              <button class="game-btn game-btn-primary text-xs flex-1">📂 加载</button>
              <button class="game-btn game-btn-danger text-xs flex-1">🗑️ 删除</button>
            </div>
          </div>
        </div>

        <div v-if="saves.length === 0" class="col-span-full game-card p-12 text-center">
          <div class="text-5xl mb-4 animate-float">💾</div>
          <p class="text-gray-400 text-lg mb-6">还没有存档，开始你的冒险吧！</p>
          <button class="game-btn game-btn-primary" @click="createSave">创建第一个存档</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { gameApi } from '@/api/game'

const saves = ref([])

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('zh-CN')
}

async function createSave() {
  try {
    await gameApi.createSaveSlot(`存档 ${saves.value.length + 1}`)
    const res = await gameApi.listSaveSlots()
    saves.value = res || []
  } catch (e) {
    console.error(e)
  }
}

onMounted(async () => {
  try {
    const res = await gameApi.listSaveSlots()
    saves.value = res || []
  } catch (e) {
    console.error('Failed to load saves:', e)
  }
})
</script>