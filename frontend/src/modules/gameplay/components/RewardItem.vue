<template>
  <div class="border-2 rounded-game p-4 text-center hover:scale-105 transition-all">
    <div class="text-4xl mb-2">{{ rewardIcon }}</div>
    <h3 class="font-bold text-lg mb-1">{{ reward.name }}</h3>
    <p class="text-sm text-gray-600 mb-3">{{ reward.description }}</p>
    
    <div class="space-y-1 text-sm">
      <div v-if="reward.exp" class="flex justify-between">
        <span>经验值</span>
        <span class="font-semibold text-academic-purple">+{{ reward.exp }}</span>
      </div>
      <div v-if="reward.coins" class="flex justify-between">
        <span>喵币</span>
        <span class="font-semibold text-warning-yellow">+{{ reward.coins }}</span>
      </div>
      <div v-if="reward.item" class="flex justify-between">
        <span>物品</span>
        <span class="font-semibold text-campus-blue">{{ reward.item.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  reward: {
    type: Object,
    required: true
  }
})

const rewardIcon = computed(() => {
  if (props.reward.item) return '🎁'
  if (props.reward.exp) return '✨'
  if (props.reward.coins) return '💰'
  return '🎉'
})
</script>
