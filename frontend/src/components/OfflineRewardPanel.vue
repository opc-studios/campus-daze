<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
      <h2 class="text-2xl font-bold text-[#1A3C6E] mb-2 text-center">离线收获</h2>
      <p class="text-gray-600 text-center mb-6">
        你离开了 {{ formatDuration(offlineSeconds) }}
      </p>
      
      <div class="flex justify-center gap-8 mb-6">
        <div class="text-center">
          <p class="text-3xl font-bold text-green-500">+{{ rewards.exp }}</p>
          <p class="text-sm text-gray-500">EXP</p>
        </div>
        <div v-if="rewards.coins > 0" class="text-center">
          <p class="text-3xl font-bold text-[#FFB7C5]">+{{ rewards.coins }}</p>
          <p class="text-sm text-gray-500">校园币</p>
        </div>
      </div>
      
      <button
        @click="claim"
        class="w-full py-3 bg-[#1A3C6E] text-white rounded-lg font-semibold hover:bg-[#15305a]"
      >
        领取
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGameStore } from '../stores/game'
import { calcOfflineRewards } from '../game/combat/formulas'

const gameStore = useGameStore()

const show = ref(false)
const offlineSeconds = ref(0)
const rewards = ref({ exp: 0, coins: 0 })

onMounted(() => {
  const lastClaimedAt = gameStore.state?.idle.lastClaimedAt
  if (!lastClaimedAt || lastClaimedAt === 0) return
  
  const now = Math.floor(Date.now() / 1000)
  const elapsed = now - lastClaimedAt
  
  if (elapsed < 60) return
  
  offlineSeconds.value = elapsed
  const task = gameStore.state?.idle.task || 'study'
  rewards.value = calcOfflineRewards(task, elapsed)
  
  if (rewards.value.exp > 0 || rewards.value.coins > 0) {
    show.value = true
  }
})

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h} 小时 ${m} 分钟`
  return `${m} 分钟`
}

const claim = () => {
  if (rewards.value.exp > 0) gameStore.addExp(rewards.value.exp)
  if (rewards.value.coins > 0) gameStore.addCoins(rewards.value.coins)
  
  if (gameStore.state) {
    gameStore.state.idle.lastClaimedAt = Math.floor(Date.now() / 1000)
  }
  
  gameStore.saveSave()
  show.value = false
}
</script>
