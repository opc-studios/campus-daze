<template>
  <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
    <div
      :class="['h-full transition-all duration-300', colorClass]"
      :style="{ width: `${percentage}%` }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  percentage: number
  color?: 'blue' | 'green' | 'pink' | 'yellow'
}>()

const colorClass = computed(() => {
  const colors = {
    blue: 'bg-[#1A3C6E]',
    green: 'bg-[#4ECDC4]',
    pink: 'bg-[#FFB7C5]',
    yellow: 'bg-yellow-400'
  }
  return colors[props.color || 'blue']
})
</script>
