<template>
  <div id="idle-panel" class="bg-white rounded-lg shadow-lg p-6 scroll-mt-4">
    <h3 class="text-xl font-bold text-[#1A3C6E] mb-4">挂机任务</h3>
    
    <div class="flex gap-4 mb-4">
      <button
        @click="selectTask('study')"
        :class="[
          'flex-1 py-3 rounded-lg font-semibold transition-all',
          currentTask === 'study' ? 'bg-[#1A3C6E] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        ]"
      >
        📚 学习 (EXP +10/5s)
      </button>
      <button
        @click="selectTask('intern')"
        :class="[
          'flex-1 py-3 rounded-lg font-semibold transition-all',
          currentTask === 'intern' ? 'bg-[#4ECDC4] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        ]"
      >
        💼 实习 (EXP +6, 币 +8/5s)
      </button>
    </div>
    
    <div v-if="isIdling" class="text-center">
      <p class="text-sm text-gray-600 mb-2">
        已挂机 {{ formatDuration(elapsedTime) }}
      </p>
      <div class="flex justify-center gap-6 text-sm">
        <span class="text-green-600">预计 EXP: +{{ estimatedExp }}</span>
        <span v-if="currentTask === 'intern'" class="text-pink-600">预计 币: +{{ estimatedCoins }}</span>
      </div>
      <button
        @click="claimRewards"
        class="mt-4 px-8 py-2 bg-[#FFB7C5] text-[#1A3C6E] rounded-lg font-semibold hover:bg-[#ffa3b6]"
      >
        领取收益
      </button>
    </div>
    
    <div v-else class="text-center">
      <button
        @click="startIdling"
        class="px-8 py-2 bg-[#1A3C6E] text-white rounded-lg font-semibold hover:bg-[#15305a]"
      >
        开始挂机
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'
import type { IdleTask } from '../types/game'

const gameStore = useGameStore()

const currentTask = ref<IdleTask>('study')
const isIdling = ref(false)
const elapsedTime = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const estimatedExp = computed(() => {
  const rate = currentTask.value === 'study' ? 10 : 6
  return Math.floor(elapsedTime.value / 5) * rate
})

const estimatedCoins = computed(() => {
  if (currentTask.value !== 'intern') return 0
  return Math.floor(elapsedTime.value / 5) * 8
})

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

const selectTask = (task: IdleTask) => {
  if (isIdling.value) return
  currentTask.value = task
}

const startIdling = () => {
  isIdling.value = true
  elapsedTime.value = 0
  
  timer = setInterval(() => {
    elapsedTime.value++
    
    if (elapsedTime.value % 5 === 0) {
      if (currentTask.value === 'study') {
        gameStore.addExp(10)
      } else {
        gameStore.addExp(6)
        gameStore.addCoins(8)
      }
    }
  }, 1000)
}

const claimRewards = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  isIdling.value = false
  elapsedTime.value = 0
  gameStore.saveSave()
}
</script>
