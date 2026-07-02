<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 text-center">
      <h2 :class="['text-3xl font-bold mb-4', result.winner === 'player' ? 'text-green-500' : 'text-red-500']">
        {{ result.winner === 'player' ? '胜利!' : '失败...' }}
      </h2>
      
      <div v-if="result.winner === 'player' && result.rewards" class="mb-6">
        <h3 class="text-lg font-bold text-[#1A3C6E] mb-3">战利品</h3>
        <div class="flex justify-center gap-6">
          <div v-if="result.rewards.exp" class="text-center">
            <p class="text-2xl font-bold text-green-500">+{{ result.rewards.exp }}</p>
            <p class="text-sm text-gray-500">EXP</p>
          </div>
          <div v-if="result.rewards.credits" class="text-center">
            <p class="text-2xl font-bold text-[#4ECDC4]">+{{ result.rewards.credits }}</p>
            <p class="text-sm text-gray-500">学分</p>
          </div>
          <div v-if="result.rewards.coins" class="text-center">
            <p class="text-2xl font-bold text-[#FFB7C5]">+{{ result.rewards.coins }}</p>
            <p class="text-sm text-gray-500">校园币</p>
          </div>
        </div>
      </div>
      
      <div v-else class="mb-6">
        <p class="text-gray-600">获得 20% EXP 安慰奖</p>
      </div>
      
      <button
        @click="$emit('continue')"
        class="px-8 py-3 bg-[#1A3C6E] text-white rounded-lg font-semibold hover:bg-[#15305a]"
      >
        继续探索
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  result: {
    winner: 'player' | 'enemy'
    rewards?: {
      exp: number
      credits: number
      coins: number
    }
  }
}>()

defineEmits<{
  continue: []
}>()
</script>
